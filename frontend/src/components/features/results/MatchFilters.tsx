import React, { useState } from 'react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';

export interface MatchFilterValues {
    minOverallScore?: number;
    minSkillsScore?: number;
    minExperienceScore?: number;
    minEducationScore?: number;
    minTechnicalScore?: number;
    experienceGap?: 'ANY' | 'NONE' | '0-1' | '2+';
    educationMatch?: 'ANY' | 'PERFECT' | 'GOOD' | 'PARTIAL';
    requiredMatchedSkills?: string[];
}

interface MatchFiltersProps {
    onApply: (filters: MatchFilterValues) => void;
    initialFilters?: MatchFilterValues;
    availableSkills?: string[];
}

export const MatchFilters: React.FC<MatchFiltersProps> = ({
    onApply,
    initialFilters,
    availableSkills = [],
}) => {
    const [filters, setFilters] = useState<MatchFilterValues>(
        initialFilters || {
            minOverallScore: undefined,
            minSkillsScore: undefined,
            minExperienceScore: undefined,
            experienceGap: 'ANY',
            educationMatch: 'ANY',
            requiredMatchedSkills: [],
        }
    );

    const handleApply = () => {
        onApply(filters);
    };

    const handleClear = () => {
        const clearedFilters: MatchFilterValues = {
            minOverallScore: undefined,
            minSkillsScore: undefined,
            minExperienceScore: undefined,
            experienceGap: 'ANY',
            educationMatch: 'ANY',
            requiredMatchedSkills: [],
        };
        setFilters(clearedFilters);
        onApply(clearedFilters);
    };

    const hasActiveFilters =
        filters.minOverallScore !== undefined ||
        filters.minSkillsScore !== undefined ||
        filters.minExperienceScore !== undefined ||
        (filters.experienceGap && filters.experienceGap !== 'ANY') ||
        (filters.educationMatch && filters.educationMatch !== 'ANY') ||
        (filters.requiredMatchedSkills && filters.requiredMatchedSkills.length > 0);

    const toggleSkill = (skill: string) => {
        setFilters((prev) => ({
            ...prev,
            requiredMatchedSkills: prev.requiredMatchedSkills?.includes(skill)
                ? prev.requiredMatchedSkills.filter((s) => s !== skill)
                : [...(prev.requiredMatchedSkills || []), skill],
        }));
    };

    return (
        <Card className="mb-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Filter Results</h3>
                    {hasActiveFilters && (
                        <span className="text-sm text-gray-600">Filters active</span>
                    )}
                </div>

                {}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Minimum Score Thresholds</h4>
                    <div className="space-y-3">
                        {}
                        <div>
                            <label htmlFor="overall-score" className="block text-sm text-gray-600 mb-1">
                                Overall Score: {filters.minOverallScore || 0}%
                            </label>
                            <input
                                id="overall-score"
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={filters.minOverallScore || 0}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        minOverallScore: Number(e.target.value),
                                    })
                                }
                                className="w-full"
                            />
                        </div>

                        {}
                        <div>
                            <label htmlFor="skills-score" className="block text-sm text-gray-600 mb-1">
                                Skills Score: {filters.minSkillsScore || 0}%
                            </label>
                            <input
                                id="skills-score"
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={filters.minSkillsScore || 0}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        minSkillsScore: Number(e.target.value),
                                    })
                                }
                                className="w-full"
                            />
                        </div>

                        {}
                        <div>
                            <label htmlFor="experience-score" className="block text-sm text-gray-600 mb-1">
                                Experience Score: {filters.minExperienceScore || 0}%
                            </label>
                            <input
                                id="experience-score"
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={filters.minExperienceScore || 0}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        minExperienceScore: Number(e.target.value),
                                    })
                                }
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Gap
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {(['ANY', 'NONE', '0-1', '2+'] as const).map((option) => (
                            <label key={option} className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="experienceGap"
                                    value={option}
                                    checked={filters.experienceGap === option}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            experienceGap: e.target.value as MatchFilterValues['experienceGap'],
                                        })
                                    }
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">
                                    {option === 'ANY' ? 'Any' : option === 'NONE' ? 'No Gap' : `${option} years`}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Education Match
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {(['ANY', 'PERFECT', 'GOOD', 'PARTIAL'] as const).map((option) => (
                            <label key={option} className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="educationMatch"
                                    value={option}
                                    checked={filters.educationMatch === option}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            educationMatch: e.target.value as MatchFilterValues['educationMatch'],
                                        })
                                    }
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700 capitalize">
                                    {option === 'ANY' ? 'Any' : option.toLowerCase()}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {}
                {availableSkills.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Must Have Skills
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableSkills.map((skill) => (
                                <label
                                    key={skill}
                                    className="flex items-center cursor-pointer px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={filters.requiredMatchedSkills?.includes(skill)}
                                        onChange={() => toggleSkill(skill)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">{skill}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button variant="primary" onClick={handleApply} fullWidth>
                        Apply Filters
                    </Button>
                    <Button variant="secondary" onClick={handleClear} fullWidth disabled={!hasActiveFilters}>
                        Clear All
                    </Button>
                </div>
            </div>
        </Card>
    );
};

