import React, { useState } from "react";
import { BookOpen, Search, ChevronRight } from "lucide-react";
import Navbar from "../components/Navbar";
import TopHeader from "../components/TopHeader";

const topicData = [
  {
    category: "Arithmetic",
    topics: [
      {
        id: "fractions-percent",
        title: "Fractions & Percent",
        level: "SD",
        difficulty: "Beginner",
        description: "Add fractions and compute percentages like 15% of 200.",
        lessons: "3 lessons",
      },
      {
        id: "number-operations",
        title: "Number Operations",
        level: "SD",
        difficulty: "Beginner",
        description: "Master the four operations with whole numbers.",
        lessons: "2 lessons",
      },
    ],
  },
  {
    category: "Algebra",
    topics: [
      {
        id: "basic-algebra",
        title: "Basic Algebra",
        level: "SMP",
        difficulty: "Beginner",
        description: "Simplify expressions and solve ax + b = c equations.",
        lessons: "3 lessons",
      },
      {
        id: "linear-equations",
        title: "Linear Equations",
        level: "SMA",
        difficulty: "Beginner",
        description: "Solve and simplify ax + b = c style equations.",
        lessons: "4 lessons",
      },
      {
        id: "quadratic-functions",
        title: "Quadratic Functions",
        level: "SMA",
        difficulty: "Intermediate",
        description: "Solve ax² + bx + c = 0 and graph parabolas.",
        lessons: "4 lessons",
      },
    ],
  },
  {
    category: "Geometry",
    topics: [
      {
        id: "triangle-basics",
        title: "Triangle Basics",
        level: "SMP",
        difficulty: "Beginner",
        description: "Area, angles, and the Pythagorean theorem a² + b² = c².",
        lessons: "3 lessons",
      },
      {
        id: "angles-polygons",
        title: "Angles & Coordinates",
        level: "SMA",
        difficulty: "Intermediate",
        description: "Explore plane angles, polygons, and coordinate geometry.",
        lessons: "4 lessons",
      },
    ],
  },
];

const levelFilters = ["All Levels", "SD", "SMP", "SMA"];
const difficultyFilters = ["All", "Beginner", "Intermediate", "Advanced"];

const Topics = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  // Difficulty badge styling
  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case "Beginner":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200/80";
      case "Intermediate":
        return "bg-amber-50 text-amber-600 border border-amber-200/80";
      case "Advanced":
        return "bg-purple-50 text-purple-600 border border-purple-200/80";
      default:
        return "bg-neutral-100 text-neutral-600 border border-neutral-200";
    }
  };

  // Filter topics dynamically
  const filteredCategories = topicData
    .map((cat) => {
      const filtered = cat.topics.filter((topic) => {
        const matchesSearch =
          topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLevel =
          selectedLevel === "All Levels" || topic.level === selectedLevel;

        const matchesDiff =
          selectedDifficulty === "All" || topic.difficulty === selectedDifficulty;

        return matchesSearch && matchesLevel && matchesDiff;
      });

      return { ...cat, topics: filtered };
    })
    .filter((cat) => cat.topics.length > 0);

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      {/* Sidebar Navigation */}
      <Navbar activePage="Topik" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-7 max-w-6xl mx-auto w-full pb-24 md:pb-8">
        {/* Top Header Fixed / Uniform across pages */}
        <TopHeader />

        {/* Page Title & Subtitle */}
        <section className="mb-5">
          <h1 className="font-heading text-xl md:text-2xl font-bold text-neutral-text">
            Topic Library
          </h1>
          <p className="text-xs md:text-sm text-neutral-muted mt-1">
            Browse all math topics, filter by level and difficulty, and start practicing.
          </p>
        </section>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-neutral-card border border-neutral-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-neutral-muted/70 text-neutral-text"
          />
        </div>

        {/* Filters (Level & Difficulty) */}
        <div className="space-y-2 mb-6">
          {/* Level Filter (Only SD, SMP, SMA - no College) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {levelFilters.map((lvl) => {
              const isActive = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                    isActive
                      ? "bg-primary text-white border border-primary shadow-xs"
                      : "bg-neutral-card text-neutral-muted border border-neutral-border hover:bg-neutral-50 hover:text-neutral-text"
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {difficultyFilters.map((diff) => {
              const isActive = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                    isActive
                      ? "bg-primary text-white border border-primary shadow-xs"
                      : "bg-neutral-card text-neutral-muted border border-neutral-border hover:bg-neutral-50 hover:text-neutral-text"
                  }`}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic Categories & Cards */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-neutral-card rounded-2xl border border-neutral-border">
            <p className="text-xs md:text-sm text-neutral-muted">
              Tidak ada topik matematika yang cocok dengan filter atau pencarian.
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            {filteredCategories.map((category) => (
              <section key={category.category}>
                {/* Category Name */}
                <h2 className="font-heading text-sm md:text-base font-bold text-neutral-text mb-3">
                  {category.category}
                </h2>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="bg-neutral-card border border-neutral-border rounded-2xl p-4 flex flex-col justify-between hover:border-primary/40 hover:shadow-xs transition-all duration-200"
                    >
                      <div>
                        {/* Topic Icon */}
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-primary mb-3">
                          <BookOpen className="w-4 h-4" />
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-neutral-text leading-snug">
                          {topic.title}
                        </h3>

                        {/* Badges (Difficulty + Level) */}
                        <div className="flex items-center gap-1.5 mt-2 mb-2 flex-wrap">
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${getDifficultyBadge(
                              topic.difficulty
                            )}`}
                          >
                            {topic.difficulty}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                            {topic.level}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-neutral-muted leading-relaxed line-clamp-2 min-h-[34px]">
                          {topic.description}
                        </p>

                        {/* Lessons Count */}
                        <p className="text-[11px] text-neutral-muted/80 mt-2 mb-4">
                          {topic.lessons}
                        </p>
                      </div>

                      {/* Action Button */}
                      <button className="w-full py-1.5 px-3 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-white text-xs font-medium flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer">
                        <span>Start Topic</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Topics;
