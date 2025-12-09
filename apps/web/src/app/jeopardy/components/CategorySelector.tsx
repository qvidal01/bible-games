'use client';

import { useState } from 'react';
import { CATEGORY_DEFINITIONS } from '../data/categories';

interface CategorySelectorProps {
  onStartGame: (categoryIds: string[]) => void;
  onCancel: () => void;
  isStudyMode?: boolean;
}

export default function CategorySelector({ onStartGame, onCancel, isStudyMode = false }: CategorySelectorProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, categoryId];
    });
  };

  const selectRandom = () => {
    const shuffled = [...CATEGORY_DEFINITIONS].sort(() => Math.random() - 0.5);
    setSelectedCategories(shuffled.slice(0, 5).map((c) => c.id));
  };

  return (
    <div className={`rounded-2xl p-6 max-w-4xl mx-auto border ${
      isStudyMode
        ? 'bg-green-900/30 border-green-700'
        : 'bg-blue-900/80 border-blue-700'
    }`}>
      <h2 className={`text-2xl font-bold text-center mb-2 ${isStudyMode ? 'text-green-400' : 'text-yellow-400'}`}>
        {isStudyMode ? '📖 Select Categories to Study' : 'Select 5 Categories'}
      </h2>
      <p className="text-blue-300 text-center mb-6">
        {isStudyMode
          ? `Choose what you want to practice (${selectedCategories.length}/5 selected)`
          : `Choose the categories for your Jeopardy board (${selectedCategories.length}/5 selected)`
        }
      </p>

      {/* Random button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={selectRandom}
          className="px-6 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Random Selection
        </button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {CATEGORY_DEFINITIONS.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const isDisabled = !isSelected && selectedCategories.length >= 5;

          return (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              disabled={isDisabled}
              className={`
                p-3 rounded-lg text-left transition-all
                ${isSelected
                  ? 'bg-yellow-500 text-blue-900 ring-2 ring-yellow-300'
                  : isDisabled
                    ? 'bg-blue-950/50 text-blue-700 cursor-not-allowed'
                    : 'bg-blue-800 text-white hover:bg-blue-700'
                }
              `}
            >
              <p className="font-semibold text-sm">{category.name}</p>
              <p className={`text-xs mt-1 ${isSelected ? 'text-blue-800' : 'text-blue-400'}`}>
                {category.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Categories Preview */}
      {selectedCategories.length > 0 && (
        <div className="mb-6">
          <p className="text-blue-300 text-sm mb-2">Selected order:</p>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((catId, index) => {
              const cat = CATEGORY_DEFINITIONS.find((c) => c.id === catId);
              return (
                <span
                  key={catId}
                  className="bg-yellow-500 text-blue-900 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {index + 1}. {cat?.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-blue-800 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          {isStudyMode ? 'Exit' : 'Cancel'}
        </button>
        <button
          onClick={() => onStartGame(selectedCategories)}
          disabled={selectedCategories.length !== 5}
          className={`
            flex-1 py-3 font-bold rounded-xl transition-colors
            ${selectedCategories.length === 5
              ? isStudyMode
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-yellow-500 hover:bg-yellow-400 text-blue-900'
              : 'bg-blue-950 text-blue-700 cursor-not-allowed'
            }
          `}
        >
          {isStudyMode ? 'Start Studying' : 'Start Game'}
        </button>
      </div>
    </div>
  );
}
