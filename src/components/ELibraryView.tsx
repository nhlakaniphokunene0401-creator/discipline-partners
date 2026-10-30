import React, { useState } from "react";
import { SchoolResource } from "../types";
import { getResources } from "../data/storage";

interface ELibraryViewProps {
  examCentreNumber: string;
  userGrade?: "10" | "11" | "12";
}

export const ELibraryView: React.FC<ELibraryViewProps> = ({
  examCentreNumber,
  userGrade,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<string>(
    userGrade || "All"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const resources = getResources(examCentreNumber);

  const filteredResources = resources.filter((res) => {
    const matchGrade =
      selectedGrade === "All" || res.grade === selectedGrade;
    const matchSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGrade && matchSearch;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">E-Library & Resources</h1>

      <div className="flex gap-4 mb-6">
        <select
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="All">All Grades</option>
          <option value="10">Grade 10</option>
          <option value="11">Grade 11</option>
          <option value="12">Grade 12</option>
        </select>

        <input
          type="text"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* School Uploaded Textbooks */}
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <a
              key={resource.id}
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block border rounded-lg p-4 hover:shadow-md transition"
            >
              <h3 className="font-semibold">{resource.title}</h3>
              <p className="text-sm text-gray-600">{resource.subject}</p>
              <p className="text-xs text-gray-500 mt-2">
                Grade {resource.grade}
              </p>
            </a>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No resources found. Your teachers can upload textbooks here.
          </div>
        )}
      </div>
    </div>
  );
};
