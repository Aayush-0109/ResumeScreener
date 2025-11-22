import React, { useState, useEffect } from 'react';
import { Button } from '../../common/Button';
import { Card, CardHeader } from '../../common/Card';
import { Select } from '../../common/Input';

export interface MatchConfig {
    topN?: number;
    weights?: {
        skills?: number;
        experience?: number;
        education?: number;
        technical?: number;
    };
    insightsTopK?: number;
}

interface MatchConfigFormProps {
    onSubmit: (config: MatchConfig) => void;
    onCancel?: () => void;
    isSubmitting?: boolean;
}

const DEFAULT_WEIGHTS = {
    skills: 35,
    experience: 25,
    education: 10,
    technical: 30,
};

export const MatchConfigForm: React.FC<MatchConfigFormProps> = ({
    onSubmit,
    onCancel,
    isSubmitting = false,
}) => {
    const [topN, setTopN] = useState<number>(10);
    const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
    const [insightsTopK, setInsightsTopK] = useState<number>(5);
    const [weightError, setWeightError] = useState<string>('');

    
    useEffect(() => {
        const sum = Object.values(weights).reduce((acc, val) => acc + val, 0);
        if (Math.abs(sum - 100) > 1) {
            setWeightError(`Weights must sum to 100% (current: ${sum}%)`);
        } else {
            setWeightError('');
        }
    }, [weights]);

    const handleWeightChange = (key: keyof typeof weights, value: number) => {
        setWeights((prev) => ({
            ...prev,
            [key]: Math.max(0, Math.min(100, value)),
        }));
    };

    const handleReset = () => {
        setWeights(DEFAULT_WEIGHTS);
        setTopN(10);
        setInsightsTopK(5);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (weightError) {
            return;
        }

        
        const config: MatchConfig = {
            topN: topN || undefined,
            weights: {
                skills: weights.skills / 100,
                experience: weights.experience / 100,
                education: weights.education / 100,
                technical: weights.technical / 100,
            },
            insightsTopK: insightsTopK,
        };

        onSubmit(config);
    };

    const weightsSum = Object.values(weights).reduce((acc, val) => acc + val, 0);

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader title="Matching Configuration" subtitle="Customize how resumes are scored" />

                <div className="space-y-6">
                    {}
                    <Select
                        label="Number of Top Results"
                        value={topN}
                        onChange={(e) => setTopN(Number(e.target.value))}
                        fullWidth
                        options={[
                            { value: 5, label: 'Top 5' },
                            { value: 10, label: 'Top 10' },
                            { value: 20, label: 'Top 20' },
                            { value: 50, label: 'Top 50' },
                            { value: 100, label: 'Top 100' },
                            { value: 1000, label: 'All Matches' },
                        ]}
                        helperText="How many top matches to return"
                    />

                    {}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Score Weights
                            <span className="ml-2 text-xs font-normal text-gray-500">
                                (Total: {weightsSum}% {weightError && '- ' + weightError})
                            </span>
                        </label>

                        <div className="space-y-4">
                            {}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700">Skills Match</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={weights.skills}
                                        onChange={(e) => handleWeightChange('skills', Number(e.target.value))}
                                        className="w-16 text-right input px-2 py-1 text-sm"
                                    />
                                    <span className="text-gray-500">%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={weights.skills}
                                    onChange={(e) => handleWeightChange('skills', Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700">Experience Match</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={weights.experience}
                                        onChange={(e) => handleWeightChange('experience', Number(e.target.value))}
                                        className="w-16 text-right input px-2 py-1 text-sm"
                                    />
                                    <span className="text-gray-500">%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={weights.experience}
                                    onChange={(e) => handleWeightChange('experience', Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700">Education Match</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={weights.education}
                                        onChange={(e) => handleWeightChange('education', Number(e.target.value))}
                                        className="w-16 text-right input px-2 py-1 text-sm"
                                    />
                                    <span className="text-gray-500">%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={weights.education}
                                    onChange={(e) => handleWeightChange('education', Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700">Technical Fit</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={weights.technical}
                                        onChange={(e) => handleWeightChange('technical', Number(e.target.value))}
                                        className="w-16 text-right input px-2 py-1 text-sm"
                                    />
                                    <span className="text-gray-500">%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={weights.technical}
                                    onChange={(e) => handleWeightChange('technical', Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {weightError && (
                            <p className="text-sm text-red-600 mt-2">{weightError}</p>
                        )}
                    </div>

                    {}
                    <Select
                        label="Generate AI Insights"
                        value={insightsTopK}
                        onChange={(e) => setInsightsTopK(Number(e.target.value))}
                        fullWidth
                        options={[
                            { value: 0, label: 'No Insights' },
                            { value: 3, label: 'Top 3 Matches' },
                            { value: 5, label: 'Top 5 Matches' },
                            { value: 10, label: 'Top 10 Matches' },
                        ]}
                        helperText="AI-generated insights for top candidates"
                    />

                    {}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={isSubmitting}
                            disabled={!!weightError}
                        >
                            Start Matching
                        </Button>
                        <Button type="button" variant="secondary" onClick={handleReset}>
                            Reset
                        </Button>
                        {onCancel && (
                            <Button type="button" variant="ghost" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </form>
    );
};

