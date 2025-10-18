import React, { useState } from 'react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';

export interface ResumeFilterValues {
    skills: string[];
    experienceMin?: number;
    experienceMax?: number;
    parseStatus?: 'ALL' | 'DONE' | 'PENDING' | 'FAILED';
}

interface ResumeFiltersProps {
    onApply: (filters: ResumeFilterValues) => void;
    initialFilters?: ResumeFilterValues;
    availableSkills?: string[];
}

export const ResumeFilters: React.FC<ResumeFiltersProps> = ({
    onApply,
    initialFilters,
    availableSkills = [],
}) => {
    const [filters, setFilters] = useState<ResumeFilterValues>(
        initialFilters || {
            skills: [],
            experienceMin: undefined,
            experienceMax: undefined,
            parseStatus: 'ALL',
        }
    );

    const [skillInput, setSkillInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Filter available skills based on input
    const filteredSuggestions = availableSkills.filter(
        (skill) =>
            skill.toLowerCase().includes(skillInput.toLowerCase()) &&
            !filters.skills.includes(skill)
    );

    const handleAddSkill = (skill: string) => {
        if (skill && !filters.skills.includes(skill)) {
            setFilters((prev) => ({
                ...prev,
                skills: [...prev.skills, skill],
            }));
            setSkillInput('');
            setShowSuggestions(false);
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setFilters((prev) => ({
            ...prev,
            skills: prev.skills.filter((s) => s !== skillToRemove),
        }));
    };

    const handleApply = () => {
        onApply(filters);
    };

    const handleClear = () => {
        const clearedFilters: ResumeFilterValues = {
            skills: [],
            experienceMin: undefined,
            experienceMax: undefined,
            parseStatus: 'ALL',
        };
        setFilters(clearedFilters);
        onApply(clearedFilters);
    };

    const hasActiveFilters =
        filters.skills.length > 0 ||
        filters.experienceMin !== undefined ||
        filters.experienceMax !== undefined ||
        (filters.parseStatus && filters.parseStatus !== 'ALL');

    return (
        <Card className="mb-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    {hasActiveFilters && (
                        <span className="text-sm text-gray-600">
                            {[
                                filters.skills.length > 0 && `${filters.skills.length} skill(s)`,
                                (filters.experienceMin !== undefined ||
                                    filters.experienceMax !== undefined) &&
                                'experience range',
                                filters.parseStatus && filters.parseStatus !== 'ALL' && 'parse status',
                            ]
                                .filter(Boolean)
                                .join(', ')}{' '}
                            applied
                        </span>
                    )}
                </div>

                {/* Skills Filter (Backend) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Skills <span className="text-xs text-gray-500">(Backend Filter)</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => {
                                setSkillInput(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && skillInput.trim()) {
                                    handleAddSkill(skillInput.trim());
                                }
                            }}
                            placeholder="Type to add skills..."
                            className="input w-full"
                        />

                        {/* Autocomplete suggestions */}
                        {showSuggestions && filteredSuggestions.length > 0 && skillInput && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
                                {filteredSuggestions.map((skill) => (
                                    <button
                                        key={skill}
                                        type="button"
                                        onClick={() => handleAddSkill(skill)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                    >
                                        {skill}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected skills */}
                    {filters.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {filters.skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSkill(skill)}
                                        className="ml-2 hover:text-blue-900"
                                        aria-label={`Remove ${skill}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Experience Range (Backend) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Range (years){' '}
                        <span className="text-xs text-gray-500">(Backend Filter)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={filters.experienceMin || ''}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        experienceMin: e.target.value ? Number(e.target.value) : undefined,
                                    }))
                                }
                                placeholder="Min"
                                className="input w-full"
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={filters.experienceMax || ''}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        experienceMax: e.target.value ? Number(e.target.value) : undefined,
                                    }))
                                }
                                placeholder="Max"
                                className="input w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Parse Status (Client-side) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parse Status{' '}
                        <span className="text-xs text-gray-500">(Client-side Filter)</span>
                    </label>
                    <div className="flex gap-3">
                        {(['ALL', 'DONE', 'PENDING', 'FAILED'] as const).map((status) => (
                            <label key={status} className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="parseStatus"
                                    value={status}
                                    checked={filters.parseStatus === status}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            parseStatus: e.target.value as ResumeFilterValues['parseStatus'],
                                        }))
                                    }
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">{status}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
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

