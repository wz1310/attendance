import React, { useState, useRef } from "react";
import { User, FeedPost } from "../types";

interface FeedsProps {
  user: User;
  posts: FeedPost[];
  onAddPost: (post: FeedPost) => void;
  onRefresh?: () => Promise<void>;
}

const Feeds: React.FC<FeedsProps> = ({ user, posts, onAddPost, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [isAchievement, setIsAchievement] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  // Pull to refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartRef = useRef<number>(0);
  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Hanya izinkan pulling jika di mode expanded dan scroll di posisi paling atas
    if (!isExpanded || window.scrollY > 0) return;
    touchStartRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isExpanded || window.scrollY > 0 || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartRef.current;

    if (diff > 0) {
      setIsPulling(true);
      // Gunakan logaritma atau pembagi untuk efek resistensi (rubber band effect)
      const dampenedDiff = Math.min(diff * 0.4, 120);
      setPullDistance(dampenedDiff);

      // Mencegah scroll default saat menarik ke bawah
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    if (pullDistance >= PULL_THRESHOLD && onRefresh) {
      setIsRefreshing(true);
      setPullDistance(50); // Tahan sebentar di posisi 50px untuk loading visual
      try {
        await onRefresh();
      } catch (err) {
        console.error("Refresh failed", err);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setIsPulling(false);
        }, 800);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleViewMore = async () => {
    setIsExpanded(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleSubmit = () => {
    if (!newContent.trim()) return;

    const post: FeedPost = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.employeeId,
      userName: user.name,
      userPosition: user.position || "Employee",
      userPhoto: user.photoBase64,
      content: newContent,
      images: attachedImages,
      isAchievement: isAchievement,
      likes: 0,
      comments: 0,
      createdAt: Date.now(),
    };

    onAddPost(post);
    setIsModalOpen(false);
    setNewContent("");
    setAttachedImages([]);
    setIsAchievement(false);
  };

  const displayedPosts = isExpanded ? posts : posts.slice(0, 2);

  return (
    <div
      className="min-h-screen bg-[#F8F9FA] pb-24 touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: window.scrollY === 0 ? "pan-x pan-down" : "auto" }}
    >
      {/* Pull to Refresh Indicator */}
      <div
        className="fixed top-[64px] left-0 w-full flex justify-center z-30 transition-all pointer-events-none overflow-hidden"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 20 ? 1 : 0,
          transition: isPulling
            ? "none"
            : "height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease",
        }}
      >
        <div className="flex flex-col items-center justify-center gap-1 bg-white/60 backdrop-blur-md w-full py-2">
          <div
            className={`transition-transform duration-300 ${
              pullDistance >= PULL_THRESHOLD ? "rotate-180" : "rotate-0"
            }`}
          >
            {isRefreshing ? (
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                className="w-5 h-5 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
          </div>
          <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">
            {isRefreshing
              ? "Updating data..."
              : pullDistance >= PULL_THRESHOLD
              ? "Release to refresh"
              : "Pull to update"}
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white px-6 py-5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="w-8">
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
            {isExpanded ? "Full Feed" : "Feeds"}
          </h1>
          {isRefreshing && !isPulling && (
            <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">
              Syncing...
            </span>
          )}
        </div>
        <button className="p-2 text-slate-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </header>

      {/* Main Content Area with Pull Animation */}
      <div
        className="max-w-lg mx-auto p-4 space-y-5"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling
            ? "none"
            : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {!isExpanded && (
          <>
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-in fade-in duration-300">
              <h2 className="text-xs font-black text-slate-800 uppercase mb-4">
                Create New Post
              </h2>
              <div
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl cursor-pointer border border-transparent hover:border-indigo-100 transition-all"
              >
                <img
                  src={user.photoBase64}
                  className="w-10 h-10 rounded-full object-cover"
                  alt=""
                />
                <span className="text-slate-400 text-[11px] font-medium">
                  Share something great today...
                </span>
              </div>
            </section>

            <div className="bg-[#E1EDFF] p-5 rounded-2xl flex gap-4 items-start border border-blue-100 animate-in fade-in duration-500">
              <div className="bg-blue-500/10 p-2 rounded-xl text-blue-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">
                  INFO
                </h3>
                <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                  You have 7 unverified employees, please send invitation
                  immediately
                </p>
              </div>
              <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest whitespace-nowrap mt-4">
                Go to List
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in duration-700">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase">
                    My Onboarding
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    Total progress that you completed
                  </p>
                </div>
                <button className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                  View More
                </button>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                <div className="bg-blue-400 h-full w-[15%] rounded-full"></div>
              </div>
              <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-slate-800 uppercase">
              {isExpanded ? "Full List Feed" : "All Feeds"}
            </h2>
            {!isExpanded && posts.length > 2 && (
              <button
                onClick={handleViewMore}
                className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center gap-2"
              >
                {isRefreshing && (
                  <div className="w-2 h-2 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                View More
              </button>
            )}
            {isExpanded && (
              <button
                onClick={() => setIsExpanded(false)}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest"
              >
                Close
              </button>
            )}
          </div>

          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            {displayedPosts.length > 0 ? (
              displayedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.userPhoto}
                        className="w-10 h-10 rounded-full object-cover"
                        alt=""
                      />
                      <div>
                        <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
                          {post.userName}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                          {new Date(post.createdAt).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short" }
                          )}
                        </p>
                      </div>
                    </div>
                    <button className="text-slate-300">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {post.content}
                  </p>

                  {post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {post.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          className="w-full h-40 object-cover rounded-2xl"
                          alt=""
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
                    <div className="flex gap-4">
                      <button className="flex items-center gap-1.5 text-slate-400 group">
                        <svg
                          className="w-4 h-4 group-hover:text-red-500 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span className="text-[11px] font-bold">
                          {post.likes}
                        </span>
                      </button>
                      <button className="flex items-center gap-1.5 text-slate-400 group">
                        <svg
                          className="w-4 h-4 group-hover:text-indigo-500 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <span className="text-[11px] font-bold">
                          {post.comments}
                        </span>
                      </button>
                    </div>
                    {post.isAchievement && (
                      <div className="bg-[#FF9500] px-3 py-1 rounded-full flex items-center gap-1.5">
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <svg
                            className="w-2.5 h-2.5 text-[#FF9500]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">
                          Achievement
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-20 text-center border border-slate-100">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  Belum ada postingan
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Create Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="px-6 py-5 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-3">
              <img
                src={user.photoBase64}
                className="w-10 h-10 rounded-full object-cover"
                alt=""
              />
              <div>
                <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">
                  {user.name}
                </h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  {user.position || "Employee"}
                </p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!newContent.trim()}
              className="bg-[#FF9500] px-8 py-2.5 rounded-xl text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 disabled:opacity-50"
            >
              Post
            </button>
          </header>

          <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full text-slate-700 text-sm font-medium outline-none resize-none flex-1 placeholder:text-slate-300"
              placeholder="What's on your mind? Share some thoughts..."
            />

            {attachedImages.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                {attachedImages.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img
                      src={img}
                      className="w-24 h-24 object-cover rounded-2xl border"
                      alt=""
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 border-2 border-white"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-right text-slate-400 text-[9px] font-black uppercase tracking-widest">
              Total Character {newContent.length}/255
            </p>
          </div>

          <footer className="px-6 py-6 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div
                  onClick={() => setIsAchievement(!isAchievement)}
                  className={`w-12 h-6 rounded-full transition-all flex items-center px-1 cursor-pointer ${
                    isAchievement ? "bg-orange-400" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                      isAchievement ? "translate-x-6" : "translate-x-0"
                    }`}
                  ></div>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Achievement
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </label>
              <label className="cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </label>
            </div>
          </footer>

          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Feeds;
