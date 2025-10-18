import React, { useState } from 'react';
import { Button } from '../../common/Button';
import { Input, Textarea, Select } from '../../common/Input';
import { Card } from '../../common/Card';
import toast from 'react-hot-toast';

export interface JobFormData {
    title: string;
    description: string;
    requirements: string;
    skills: string[];
    experience?: number;
    education?: string;
    location?: string;
    salary?: string;
}

interface JobFormProps {
    initialData?: Partial<JobFormData>;
    onSubmit: (data: JobFormData) => Promise<void>;
    onCancel?: () => void;
    submitLabel?: string;
    showCard?: boolean;
}

export const JobForm: React.FC<JobFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    submitLabel = 'Create Job',
    showCard = false,
}) => {
    const [formData, setFormData] = useState<JobFormData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        requirements: initialData?.requirements || '',
        skills: initialData?.skills || [],
        experience: initialData?.experience,
        education: initialData?.education || '',
        location: initialData?.location || '',
        salary: initialData?.salary || '',
    });

    const [skillInput, setSkillInput] = useState('');
    const [errors, setErrors] = useState<Partial<Record<keyof JobFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof JobFormData, string>> = {};

        if (!formData.title || formData.title.length < 2) {
            newErrors.title = 'Title must be at least 2 characters';
        } else if (formData.title.length > 200) {
            newErrors.title = 'Title must be less than 200 characters';
        }

        if (!formData.description || formData.description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }

        if (!formData.requirements || formData.requirements.length < 5) {
            newErrors.requirements = 'Requirements must be at least 5 characters';
        }

        if (formData.skills.length === 0) {
            newErrors.skills = 'At least one skill is required';
        }

        if (formData.experience !== undefined && formData.experience < 0) {
            newErrors.experience = 'Experience cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddSkill = () => {
        const skill = skillInput.trim();
        if (skill && !formData.skills.includes(skill)) {
            setFormData((prev) => ({
                ...prev,
                skills: [...prev.skills, skill],
            }));
            setSkillInput('');
            // Clear skills error if exists
            if (errors.skills) {
                setErrors((prev) => ({ ...prev, skills: undefined }));
            }
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setFormData((prev) => ({
            ...prev,
            skills: prev.skills.filter((s) => s !== skillToRemove),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit(formData);
            toast.success('Job saved successfully');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to save job');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formContent = (
        <div className="space-y-4">
            {/* Title */}
            <Input
                label="Job Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={errors.title}
                required
                fullWidth
                placeholder="e.g., Senior Frontend Developer"
            />

            {/* Description */}
            <Textarea
                label="Job Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={errors.description}
                required
                fullWidth
                placeholder="Describe the role, responsibilities, and what the ideal candidate will be doing..."
                rows={6}
            />

            {/* Requirements */}
            <Textarea
                label="Requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                error={errors.requirements}
                required
                fullWidth
                placeholder="List the key requirements and qualifications..."
                rows={4}
            />

            {/* Skills */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Skills <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSkill();
                            }
                        }}
                        placeholder="Type a skill and press Enter"
                        className="input flex-1"
                    />
                    <Button type="button" onClick={handleAddSkill} variant="secondary">
                        Add
                    </Button>
                </div>

                {errors.skills && (
                    <p className="text-sm text-red-600 mb-2">{errors.skills}</p>
                )}

                {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
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

            {/* Experience */}
            <Input
                label="Required Experience (years)"
                type="number"
                min="0"
                max="50"
                value={formData.experience || ''}
                onChange={(e) =>
                    setFormData({
                        ...formData,
                        experience: e.target.value ? Number(e.target.value) : undefined,
                    })
                }
                error={errors.experience}
                fullWidth
                placeholder="e.g., 3"
                helperText="Leave empty if not required"
            />

            {/* Education */}
            <Input
                label="Required Education"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                fullWidth
                placeholder="e.g., B.Tech in Computer Science or equivalent"
                helperText="Optional"
            />

            {/* Location */}
            <Select
                label="Work Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                fullWidth
                options={[
                    { value: '', label: 'Select location type...' },
                    { value: 'Remote', label: 'Remote' },
                    { value: 'Hybrid', label: 'Hybrid' },
                    { value: 'On-site', label: 'On-site' },
                ]}
            />

            {/* Salary */}
            <Input
                label="Salary Range"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                fullWidth
                placeholder="e.g., $80,000 - $120,000"
                helperText="Optional"
            />

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button type="submit" variant="primary" isLoading={isSubmitting} fullWidth>
                    {submitLabel}
                </Button>
                {onCancel && (
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit}>
            {showCard ? <Card>{formContent}</Card> : formContent}
        </form>
    );
};

