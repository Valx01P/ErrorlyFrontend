import { useState, useEffect } from "react";
import {
  Menu,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  X,
  Edit,
  Trash2,
  Reply,
} from "lucide-react";
import { useAppSelector } from "../store/hooks";

interface Post {
  id: number;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  score: number;
  last_updated: string;
  tags: string[];
}

interface Comment {
  id: number;
  user_id: string;
  post_id?: number;
  parent_comment_id?: number;
  content: string;
  score: number;
  created_at: string;
  last_updated: string;
}

interface Vote {
  id: number;
  user_id: string;
  post_id?: number;
  comment_id?: number;
  positive: boolean;
}

// Response interfaces
interface PostsResponse {
  message?: string;
  posts?: Post[];
}

interface CommentsResponse {
  message?: string;
  comments?: Comment[];
}

interface VotesResponse {
  message?: string;
  votes?: Vote[];
}

interface PostResponse {
  message?: string;
  post?: Post;
}

interface CommentResponse {
  message?: string;
  comment?: Comment;
}

interface VoteResponse {
  message?: string;
  vote?: Vote;
  post?: Post;
  comment?: Comment;
}

const Dashboard = () => {
  const [closeSidebar, setCloseSidebar] = useState(false);
  const [activeContent, setActiveContent] = useState("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [layoutMenu, setLayoutMenu] = useState(false);
  const [layoutType, setLayoutType] = useState(
    localStorage.getItem("layout") || "large"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterBy, setFilterBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostTags, setEditPostTags] = useState<string[]>([]);

  const user = useAppSelector((state) => state.user.user);

  const handleNewComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !commentContent.trim()) return;

    try {
      const response = await fetch(
        "https://errorlyapi.onrender.com/comments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          credentials: "include",
          body: JSON.stringify({
            post_id: selectedPost.id,
            content: commentContent.trim(),
          }),
        }
      );
      const data: CommentResponse = await response.json();
      if (response.ok && data.comment) {
        setComments([...comments, data.comment!]); // Added '!'
        setCommentContent("");
      } else {
        console.error("Failed to create comment:", data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchUserVotes();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id);
    }
  }, [selectedPost]);

  useEffect(() => {
    if (editingPost) {
      setEditPostTitle(editingPost.title);
      setEditPostContent(editingPost.content);
      setEditPostTags(editingPost.tags || []);
    }
  }, [editingPost]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("https://errorlyapi.onrender.com/posts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        credentials: "include",
      });

      const data: PostsResponse = await response.json();

      if (response.ok && data.posts) {
        // Ensure each post has a tags array
        const postsWithTags = data.posts.map((post) => ({
          ...post,
          tags: post.tags || [],
        }));
        setPosts(postsWithTags);
        const tags = [
          ...new Set(postsWithTags.flatMap((post: Post) => post.tags)),
        ];
        setAllTags(tags);
      } else {
        console.error("Failed to fetch posts:", data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  const handleNewPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("https://errorlyapi.onrender.com/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        credentials: "include",
        body: JSON.stringify({
          post: { title, content },
          tags,
        }),
      });

      const data: PostResponse = await response.json();

      if (response.ok && data.post) {
        // Ensure tags are defined
        if (!data.post.tags) {
          data.post.tags = [];
        }

        setPosts([data.post, ...posts]);
        setTitle("");
        setContent("");
        setTags([]);
        setActiveContent("posts");
      } else {
        console.error("Failed to create post:", data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      const response = await fetch(
        `https://errorlyapi.onrender.com/posts/${editingPost.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          credentials: "include",
          body: JSON.stringify({
            post: {
              title: editPostTitle,
              content: editPostContent,
            },
            tags: editPostTags,
          }),
        }
      );

      const data: PostResponse = await response.json();

      if (response.ok && data.post) {
        const updatedPost = {
          ...editingPost,
          title: editPostTitle,
          content: editPostContent,
          tags: editPostTags,
        };
        setPosts(posts.map((p) => (p.id === editingPost.id ? updatedPost : p)));
        if (selectedPost?.id === editingPost.id) {
          setSelectedPost(updatedPost);
        }
        setEditingPost(null);
        setShowPostMenu(null);
      } else {
        console.error("Failed to update post:", data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Failed to update post:", error);
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      console.log("Deleting post:", postId);
      const response = await fetch(
        `https://errorlyapi.onrender.com/posts/${postId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          credentials: "include",
        }
      );

      const data: PostResponse = await response.json();

      if (response.ok) {
        // Remove post from local state
        setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));

        // Close the post if it was selected
        if (selectedPost?.id === postId) {
          setSelectedPost(null);
        }

        // Close the menu
        setShowPostMenu(null);

        // Close edit modal if open
        if (editingPost?.id === postId) {
          setEditingPost(null);
        }
      } else {
        console.error("Failed to delete post:", data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      // Optionally refresh the posts list on error
      await fetchPosts();
    }
  };

  const fetchComments = async (postId: number) => {
    try {
      const response = await fetch(
        `https://errorlyapi.onrender.com/comments?post_id=${postId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          credentials: "include",
        }
      );

      const data: CommentsResponse = await response.json();

      if (response.ok && data.comments) {
        setComments(data.comments);
      } else {
        console.error(
          "Failed to fetch comments:",
          data.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const fetchUserVotes = async () => {
    try {
      const response = await fetch("https://errorlyapi.onrender.com/votes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        credentials: "include",
      });

      const data: VotesResponse = await response.json();

      if (response.ok && data.votes) {
        const votesMap: Record<string, boolean> = {};
        data.votes.forEach((vote: Vote) => {
          if (vote.post_id) votesMap[`post_${vote.post_id}`] = vote.positive;
          if (vote.comment_id)
            votesMap[`comment_${vote.comment_id}`] = vote.positive;
        });
        setUserVotes(votesMap);
      } else {
        console.error("Failed to fetch votes:", data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Failed to fetch votes:", error);
    }
  };

  const handleVote = async (
    type: "post" | "comment",
    id: number,
    positive: boolean
  ) => {
    const currentVote = userVotes[`${type}_${id}`];

    let method = "";
    let endpoint = "https://errorlyapi.onrender.com/votes";
    let body: any = {
      [`${type}_id`]: id,
      positive: positive,
    };

    if (currentVote === undefined) {
      method = "POST";
    } else if (currentVote === positive) {
      method = "DELETE";
      delete body.positive;
    } else {
      method = "PUT";
    }

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data: VoteResponse = await response.json();

      if (response.ok) {
        // Update the item's score in the state
        updateScoreInState(data, type, id);

        // Update the userVotes state
        if (method === "DELETE") {
          setUserVotes((prev) => {
            const newVotes = { ...prev };
            delete newVotes[`${type}_${id}`];
            return newVotes;
          });
        } else {
          setUserVotes((prev) => ({
            ...prev,
            [`${type}_${id}`]: positive,
          }));
        }
      } else {
        console.error(`${method} vote failed:`, data.message || "Unknown error");
      }
    } catch (error) {
      console.error(
        `Error while ${
          method === "POST"
            ? "creating"
            : method === "PUT"
            ? "updating"
            : "deleting"
        } vote:`,
        error
      );
    }
  };

  const updateScoreInState = (
    data: VoteResponse,
    type: "post" | "comment",
    id: number
  ) => {
    if (type === "post" && data.post) {
      const updatedItem = data.post;
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === id) {
            return { ...p, score: updatedItem.score };
          }
          return p;
        })
      );
      if (selectedPost?.id === id) {
        setSelectedPost((prev) =>
          prev ? { ...prev, score: updatedItem.score } : null
        );
      }
    } else if (type === "comment" && data.comment) {
      const updatedItem = data.comment;
      setComments((prevComments) =>
        prevComments.map((c) => {
          if (c.id === id) {
            return { ...c, score: updatedItem.score };
          }
          return c;
        })
      );
    }
  };

  const handleUpdateComment = async (commentId: number, newContent: string) => {
    try {
      const response = await fetch(
        `https://errorlyapi.onrender.com/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          credentials: "include",
          body: JSON.stringify({ content: newContent.trim() }),
        }
      );
      const data: CommentResponse = await response.json();
      if (response.ok && data.comment) {
        setComments(
          comments.map((c) => (c.id === commentId ? data.comment! : c)) // Added '!'
        );
        setEditingComment(null);
      } else {
        console.error("Failed to update comment:", data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await fetch(
        `https://errorlyapi.onrender.com/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          credentials: "include",
        }
      );
      const data: CommentResponse = await response.json();
      if (response.ok) {
        setComments((prevComments) =>
          prevComments.filter((c) => c.id !== commentId)
        );
      } else {
        console.error("Failed to delete comment:", data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const getFilteredPosts = () => {
    let filtered = [...posts];

    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((post) =>
        selectedTags.every((tag) => post.tags.includes(tag))
      );
    }

    switch (filterBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "popular":
        filtered.sort((a, b) => b.score - a.score);
        break;
      case "unpopular":
        filtered.sort((a, b) => a.score - b.score);
        break;
    }

    return filtered;
  };

  interface CommentThreadProps {
    comment: Comment;
    depth?: number;
  }

  const CommentThread: React.FC<CommentThreadProps> = ({
    comment,
    depth = 0,
  }) => {
    const childComments = comments.filter(
      (c) => c.parent_comment_id === comment.id
    );
    const isOwner = comment.user_id === user.id;
    const [editContent, setEditContent] = useState(comment.content);
    const [replyContent, setReplyContent] = useState("");
    const [isReplying, setIsReplying] = useState(false);

    const handleReply = async () => {
      if (!replyContent.trim()) return;
      if (!selectedPost) return;

      try {
        const response = await fetch(
          "https://errorlyapi.onrender.com/comments",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            credentials: "include",
            body: JSON.stringify({
              post_id: selectedPost.id,
              parent_comment_id: comment.id,
              content: replyContent.trim(),
            }),
          }
        );
        const data: CommentResponse = await response.json();
        if (response.ok && data.comment) {
          setComments((prevComments) => [...prevComments, data.comment!]); // Added '!'
          setReplyContent("");
          setIsReplying(false);
        } else {
          console.error("Failed to create reply:", data.message || "Unknown error");
        }
      } catch (error) {
        console.error("Failed to create reply:", error);
      }
    };

    return (
      <div className={`border-l-2 border-zinc-700 ${depth > 0 ? "ml-4" : ""}`}>
        <div className="pl-4 py-2">
          <div className="bg-zinc-800 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              {editingComment === comment.id ? (
                <div className="flex-1 space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 bg-zinc-700 text-white rounded"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateComment(comment.id, editContent)}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingComment(null)}
                      className="px-3 py-1 bg-zinc-600 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-300 flex-1">{comment.content}</p>
              )}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <ArrowUp
                    className={`cursor-pointer ${
                      userVotes[`comment_${comment.id}`] === true
                        ? "text-blue-500"
                        : "text-white"
                    }`}
                    onClick={() => handleVote("comment", comment.id, true)}
                  />
                  <span className="text-white">{comment.score}</span>
                  <ArrowDown
                    className={`cursor-pointer ${
                      userVotes[`comment_${comment.id}`] === false
                        ? "text-red-500"
                        : "text-white"
                    }`}
                    onClick={() => handleVote("comment", comment.id, false)}
                  />
                </div>
                {isOwner && (
                  <div className="relative">
                    <MoreVertical
                      className="text-white cursor-pointer hover:text-zinc-400"
                      onClick={() =>
                        setEditingComment(
                          editingComment === comment.id ? null : comment.id
                        )
                      }
                    />
                    {editingComment === comment.id && (
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-zinc-700 ring-1 ring-black ring-opacity-5">
                        <div className="py-1">
                          <button
                            className="w-full px-4 py-2 text-sm text-white hover:bg-zinc-600 flex items-center gap-2"
                            onClick={() => setEditingComment(comment.id)}
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button
                            className="w-full px-4 py-2 text-sm text-white hover:bg-zinc-600 flex items-center gap-2"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <Reply
                  className="text-white cursor-pointer hover:text-blue-300"
                  onClick={() => setIsReplying(!isReplying)}
                />
              </div>
            </div>

            {isReplying && (
              <div className="mt-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full p-2 bg-zinc-700 text-white rounded"
                  placeholder="Write a reply..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleReply}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent("");
                    }}
                    className="px-3 py-1 bg-zinc-600 text-white rounded hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {childComments.length > 0 && (
          <div>
            {childComments.map((childComment) => (
              <CommentThread
                key={childComment.id}
                comment={childComment}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-full flex flex-1">
      {/* Sidebar */}
      <div
        className={`bg-zinc-800 min-h-full ${
          closeSidebar ? "w-[50px]" : "w-[400px]"
        } relative`}
      >
        <div className="flex items-start flex-col p-8 gap-8">
          {!closeSidebar && (
            <>
              {(activeContent === "posts" || activeContent === "tags") && (
                <h1
                  className="text-3xl text-white hover:text-blue-300 cursor-pointer"
                  onClick={() => setActiveContent("create")}
                >
                  Create Problem
                </h1>
              )}
              {(activeContent === "tags" || activeContent === "create") && (
                <h1
                  className="text-3xl text-white hover:text-blue-300 cursor-pointer"
                  onClick={() => setActiveContent("posts")}
                >
                  View Posts
                </h1>
              )}
              {(activeContent === "posts" || activeContent === "create") && (
                <h1
                  className="text-3xl text-white hover:text-blue-300 cursor-pointer"
                  onClick={() => setActiveContent("tags")}
                >
                  View Tags
                </h1>
              )}
              <h1
                className="text-3xl text-white hover:text-blue-300 cursor-pointer"
                onClick={() => setLayoutMenu(!layoutMenu)}
              >
                Layout
              </h1>
              {layoutMenu && (
                <div className="flex flex-col gap-4 ml-4">
                  {["small", "medium", "large"].map((size) => (
                    <h1
                      key={size}
                      className="text-2xl text-white hover:text-blue-300 cursor-pointer"
                      onClick={() => {
                        setLayoutType(size);
                        localStorage.setItem("layout", size);
                        setLayoutMenu(false);
                      }}
                    >
                      ⋅ {size.charAt(0).toUpperCase() + size.slice(1)}
                    </h1>
                  ))}
                </div>
              )}
            </>
          )}
          <div
            className="absolute right-0 top-1/2 w-[4px] h-[70px] bg-zinc-100 cursor-pointer"
            onClick={() => setCloseSidebar(!closeSidebar)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-zinc-600 min-h-full w-full">
        {activeContent === "posts" && (
          <div className="h-full w-full">
            {/* Search and Filter Bar */}
            <div className="p-4 flex justify-between items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-black rounded-lg border border-gray-400 p-2 w-[300px]"
                />
                <Menu
                  size={26}
                  className="absolute right-2 top-2 text-zinc-700 cursor-pointer"
                  onClick={() => setShowFilters(!showFilters)}
                />
              </div>
              {showFilters && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                  onClick={() => setShowFilters(false)}
                >
                  <div
                    className="bg-zinc-800 p-6 rounded-lg max-w-md w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-6">
                      <h3 className="text-white text-lg mb-4">Filter Posts</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-white mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {allTags.map((tag) => (
                              <button
                                key={tag}
                                onClick={() =>
                                  setSelectedTags(
                                    selectedTags.includes(tag)
                                      ? selectedTags.filter((t) => t !== tag)
                                      : [...selectedTags, tag]
                                  )
                                }
                                className={`px-2 py-1 rounded ${
                                  selectedTags.includes(tag)
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-600 text-gray-200"
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-white mb-2">Sort by</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {["newest", "oldest", "popular", "unpopular"].map(
                              (filter) => (
                                <button
                                  key={filter}
                                  onClick={() => setFilterBy(filter)}
                                  className={`px-2 py-1 rounded ${
                                    filterBy === filter
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-600 text-gray-200"
                                  }`}
                                >
                                  {filter.charAt(0).toUpperCase() +
                                    filter.slice(1)}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Posts Grid */}
            <div
              className={`overflow-auto h-[750px] ${
                layoutType === "small"
                  ? "grid grid-cols-4"
                  : layoutType === "medium"
                  ? "grid grid-cols-2"
                  : ""
              }`}
            >
              {getFilteredPosts().map((post) => (
                <div
                  key={post.id}
                  className={`bg-zinc-800 p-4 m-4 rounded-lg ${
                    layoutType === "large" ? "h-[150px]" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedPost(post)}
                    >
                      <h1 className="text-2xl text-white">{post.title}</h1>
                      <p className="text-white">{post.content}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-zinc-700 text-zinc-300 px-2 py-1 rounded-lg text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col items-center">
                        <ArrowUp
                          className={`cursor-pointer ${
                            userVotes[`post_${post.id}`] === true
                              ? "text-blue-500"
                              : "text-white"
                          } hover:text-blue-300`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote("post", post.id, true);
                          }}
                        />

                        {/* Score */}
                        <span className="text-white">{post.score}</span>

                        {/* Downvote */}
                        <ArrowDown
                          className={`cursor-pointer ${
                            userVotes[`post_${post.id}`] === false
                              ? "text-red-500"
                              : "text-white"
                          } hover:text-red-300`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote("post", post.id, false);
                          }}
                        />
                      </div>
                      {post.user_id === user.id && (
                        <div className="relative">
                          <MoreVertical
                            className="text-white cursor-pointer hover:text-zinc-400"
                            onClick={() =>
                              setShowPostMenu(
                                showPostMenu === post.id ? null : post.id
                              )
                            }
                          />
                          {showPostMenu === post.id && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-zinc-700 ring-1 ring-black ring-opacity-5">
                              <div className="py-1">
                                <button
                                  className="w-full px-4 py-2 text-sm text-white hover:bg-zinc-600 flex items-center gap-2"
                                  onClick={() => setEditingPost(post)}
                                >
                                  <Edit size={16} />
                                  Edit
                                </button>
                                <button
                                  className="w-full px-4 py-2 text-sm text-white hover:bg-zinc-600 flex items-center gap-2"
                                  onClick={() => handleDeletePost(post.id)}
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Post Modal */}
            {editingPost && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-zinc-800 p-6 rounded-lg w-full max-w-md">
                  <h2 className="text-xl text-white mb-4">Edit Post</h2>
                  <form onSubmit={handleEditPost} className="space-y-4">
                    <input
                      type="text"
                      value={editPostTitle}
                      onChange={(e) => setEditPostTitle(e.target.value)}
                      className="w-full p-2 bg-zinc-700 text-white rounded"
                      placeholder="Title"
                    />
                    <textarea
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      className="w-full p-2 bg-zinc-700 text-white rounded"
                      placeholder="Content"
                      rows={4}
                    />
                    <input
                      type="text"
                      value={editPostTags.join(",")}
                      onChange={(e) =>
                        setEditPostTags(
                          e.target.value.split(",").map((tag) => tag.trim())
                        )
                      }
                      className="w-full p-2 bg-zinc-700 text-white rounded"
                      placeholder="Tags (comma-separated)"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPost(null);
                          setShowPostMenu(null);
                        }}
                        className="px-4 py-2 bg-zinc-600 text-white rounded hover:bg-zinc-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Selected Post Modal */}
            {selectedPost && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={() => setSelectedPost(null)}
              >
                <div
                  className="bg-zinc-900 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-zinc-900 p-6 border-b border-zinc-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl text-white">
                          {selectedPost.title}
                        </h2>
                        <p className="text-zinc-300 mt-4">
                          {selectedPost.content}
                        </p>
                        {selectedPost.tags && selectedPost.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {selectedPost.tags.map((tag) => (
                              <span
                                key={tag}
                                className="bg-zinc-700 text-zinc-300 px-2 py-1 rounded-lg text-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <ArrowUp
                            className={`cursor-pointer ${
                              userVotes[`post_${selectedPost.id}`] === true
                                ? "text-blue-500"
                                : "text-white"
                            }`}
                            onClick={() =>
                              handleVote("post", selectedPost.id, true)
                            }
                          />
                          <span className="text-white">
                            {selectedPost.score}
                          </span>
                          <ArrowDown
                            className={`cursor-pointer ${
                              userVotes[`post_${selectedPost.id}`] === false
                                ? "text-red-500"
                                : "text-white"
                            }`}
                            onClick={() =>
                              handleVote("post", selectedPost.id, false)
                            }
                          />
                        </div>
                        {selectedPost.user_id === user.id && (
                          <div className="relative">
                            <MoreVertical
                              className="text-white cursor-pointer hover:text-zinc-400"
                              onClick={() =>
                                setShowPostMenu(
                                  showPostMenu === selectedPost.id
                                    ? null
                                    : selectedPost.id
                                )
                              }
                            />
                            {showPostMenu === selectedPost.id && (
                              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-zinc-700 ring-1 ring-black ring-opacity-5">
                                <div className="py-1">
                                  <button
                                    className="w-full px-4 py-2 text-sm text-white hover:bg-zinc-600 flex items-center gap-2"
                                    onClick={() => setEditingPost(selectedPost)}
                                  >
                                    <Edit size={16} />
                                    Edit
                                  </button>
                                  <button
                                    className="w-full px-4 py-2 text-sm text-white hover:bg-zinc-600 flex items-center gap-2"
                                    onClick={() =>
                                      handleDeletePost(selectedPost.id)
                                    }
                                  >
                                    <Trash2 size={16} />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <X
                          className="text-white cursor-pointer hover:text-zinc-400"
                          onClick={() => setSelectedPost(null)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="p-6">
                    <form onSubmit={handleNewComment} className="mb-6">
                      <textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-2 bg-zinc-800 text-white rounded-lg border border-zinc-700"
                        rows={3}
                      />
                      <button
                        type="submit"
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Comment
                      </button>
                    </form>

                    <div className="space-y-4">
                      {comments
                        .filter((comment) => !comment.parent_comment_id)
                        .map((comment) => (
                          <CommentThread key={comment.id} comment={comment} />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeContent === "tags" && (
          <div>
            <div
              className={`overflow-auto h-[750px] ${
                layoutType === "small"
                  ? "grid grid-cols-6"
                  : layoutType === "medium"
                  ? "grid grid-cols-2"
                  : ""
              }`}
            >
              {allTags.map((tag) => (
                <div
                  key={tag}
                  className={`bg-zinc-800 p-4 m-4 rounded-lg ${
                    layoutType === "large" ? "h-[80px]" : ""
                  }`}
                  onClick={() => {
                    setSelectedTags([tag]);
                    setActiveContent("posts");
                  }}
                >
                  <h1 className="text-2xl text-white">{tag}</h1>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeContent === "create" && (
          <div className="text-black w-full min-h-full flex align-middle justify-center items-center">
            <form
              onSubmit={handleNewPost}
              className="p-8 bg-zinc-800 w-[400px] flex flex-col gap-4"
            >
              <label className="text-white text-xl">Create Post</label>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-gray-400 p-2 w-full"
              />
              <textarea
                placeholder="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="border border-gray-400 p-2 w-full"
                rows={4}
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={tags.join(",")}
                onChange={(e) =>
                  setTags(e.target.value.split(",").map((tag) => tag.trim()))
                }
                className="border border-gray-400 p-2 w-full"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
              >
                Create Post
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
