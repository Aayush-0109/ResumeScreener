import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { ProgressBar } from '../../common/ProgressBar';
import type { MatchResult } from '../../../api/types';

interface MatchCardProps {
    match: MatchResult;
    rank?: number;
    showFullDetails?: boolean;
    onViewResume?: (match: MatchResult) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
    match,
    rank,
    showFullDetails = false,
    onViewResume,
}) => {
    const [isExpanded, setIsExpanded] = useState(showFullDetails);

    const getScoreVariant = (score?: number | null): 'success' | 'warning' | 'danger' | 'default' => {
        if (!score) return 'default';
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'danger';
    };

    const isTopMatch = rank === 1;

    return (
        <Card
            className={`${isTopMatch ? 'border-2 border-yellow-400 bg-yellow-50' : ''}`}
            padding="md"
        >
            {}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    {isTopMatch && (
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm font-semibold text-yellow-800">Best Match</span>
                        </div>
                    )}
                    <div className="flex items-baseline gap-2">
                        {rank && <span className="text-lg font-bold text-gray-500">#{rank}</span>}
                        <h3 className="text-xl font-semibold text-gray-900">
                            {match.resume.name || 'Unknown Name'}
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
                        {match.resume.email && <span>{match.resume.email}</span>}
                        {match.resume.experience !== null && match.resume.experience !== undefined && (
                            <span>• {match.resume.experience} years exp</span>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                        {match.overallMatchScore?.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">Overall Score</div>
                </div>
            </div>

            {}
            <div className="space-y-2 mb-4">
                {match.skillsMatchScore !== null && match.skillsMatchScore !== undefined && (
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">Skills Match</span>
                            <span className="font-medium">{match.skillsMatchScore.toFixed(0)}%</span>
                        </div>
                        <ProgressBar
                            value={match.skillsMatchScore}
                            max={100}
                            size="sm"
                            variant={getScoreVariant(match.skillsMatchScore)}
                        />
                    </div>
                )}

                {match.experienceMatchScore !== null && match.experienceMatchScore !== undefined && (
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">Experience Match</span>
                            <span className="font-medium">{match.experienceMatchScore.toFixed(0)}%</span>
                        </div>
                        <ProgressBar
                            value={match.experienceMatchScore}
                            max={100}
                            size="sm"
                            variant={getScoreVariant(match.experienceMatchScore)}
                        />
                    </div>
                )}

                {match.educationMatchScore !== null && match.educationMatchScore !== undefined && (
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">Education Match</span>
                            <span className="font-medium">{match.educationMatchScore.toFixed(0)}%</span>
                        </div>
                        <ProgressBar
                            value={match.educationMatchScore}
                            max={100}
                            size="sm"
                            variant={getScoreVariant(match.educationMatchScore)}
                        />
                    </div>
                )}

                {match.technicalMatchScore !== null && match.technicalMatchScore !== undefined && (
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">Technical Fit</span>
                            <span className="font-medium">{match.technicalMatchScore.toFixed(0)}%</span>
                        </div>
                        <ProgressBar
                            value={match.technicalMatchScore}
                            max={100}
                            size="sm"
                            variant={getScoreVariant(match.technicalMatchScore)}
                        />
                    </div>
                )}
            </div>

            {}
            {!showFullDetails && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium mb-2"
                >
                    {isExpanded ? 'Hide Details ▲' : 'Show Details ▼'}
                </button>
            )}

            {}
            {isExpanded && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                    {}
                    {match.matchedSkills && match.matchedSkills.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-green-700 mb-2">✓ Matched Skills</h4>
                            <div className="flex flex-wrap gap-1">
                                {match.matchedSkills.map((skill: string, index: number) => (
                                    <span
                                        key={index}
                                        className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {}
                    {match.missingSkills && match.missingSkills.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-red-700 mb-2">✗ Missing Skills</h4>
                            <div className="flex flex-wrap gap-1">
                                {match.missingSkills.map((skill: string, index: number) => (
                                    <span
                                        key={index}
                                        className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {}
                    {match.experienceGap !== null && match.experienceGap !== undefined && match.experienceGap > 0 && (
                        <div className="p-3 bg-yellow-50 rounded-md">
                            <p className="text-sm text-yellow-800">
                                <span className="font-semibold">Experience Gap:</span> Candidate needs{' '}
                                {match.experienceGap} more {match.experienceGap === 1 ? 'year' : 'years'} of
                                experience
                            </p>
                        </div>
                    )}

                    {}
                    {match.educationMatch && (
                        <div>
                            <p className="text-sm text-gray-700">
                                <span className="font-semibold">Education:</span> {match.resume.education || 'Not specified'}{' '}
                                <span
                                    className={`ml-2 px-2 py-0.5 rounded text-xs ${match.educationMatch === 'perfect_match' || match.educationMatch === 'match'
                                        ? 'bg-green-100 text-green-800'
                                        : match.educationMatch === 'good_match' || match.educationMatch === 'higher'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    {match.educationMatch.replace('_', ' ')}
                                </span>
                            </p>
                        </div>
                    )}

                    {}
                    {match.aiMatchInsights && (
                        <div className="p-3 bg-blue-50 rounded-md">
                            <h4 className="text-sm font-semibold text-blue-900 mb-1">💡 AI Insights</h4>
                            <p className="text-sm text-blue-800">{match.aiMatchInsights}</p>
                        </div>
                    )}

                    {}
                    {match.resume.education && (
                        <div className="text-sm text-gray-700">
                            <span className="font-semibold">Candidate Education:</span> {match.resume.education}
                        </div>
                    )}

                    {match.resume.skills && match.resume.skills.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">All Candidate Skills</h4>
                            <div className="flex flex-wrap gap-1">
                                {match.resume.skills.map((skill: string, index: number) => (
                                    <span
                                        key={index}
                                        className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {}
            <div className="flex gap-2 pt-3 border-t border-gray-200 mt-3">
                {onViewResume && (
                    <Button size="sm" variant="primary" onClick={() => onViewResume(match)}>
                        View Full Resume
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(`mailto:${match.resume.email}`, '_blank')}
                    disabled={!match.resume.email}
                >
                    Contact
                </Button>
            </div>
        </Card>
    );
};

