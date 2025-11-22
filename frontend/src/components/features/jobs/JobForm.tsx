import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { X, Plus } from 'lucide-react';
import { useState } from 'react';

const jobSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    requirements: z.string().min(10, 'Requirements must be at least 10 characters'),
    skills: z.array(z.string()).min(1, 'At least one skill is required'),
    experience: z.number().min(0).optional(),
    education: z.string().optional(),
    location: z.string().optional(),
    salary: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobFormProps {
    initialData?: Partial<JobFormData>;
    onSubmit: (data: JobFormData) => Promise<void>;
    onCancel: () => void;
    submitLabel?: string;
}

export const JobForm = ({ initialData, onSubmit, onCancel, submitLabel = 'Create Job' }: JobFormProps) => {
    const [skillInput, setSkillInput] = useState('');
    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<JobFormData>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            requirements: initialData?.requirements || '',
            skills: initialData?.skills || [],
            experience: initialData?.experience,
            education: initialData?.education || '',
            location: initialData?.location || '',
            salary: initialData?.salary || '',
        }
    });

    const skills = watch('skills');

    const addSkill = () => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            setValue('skills', [...skills, skillInput.trim()]);
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setValue('skills', skills.filter(skill => skill !== skillToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input id="title" {...register('title')} placeholder="e.g. Senior React Developer" />
                    {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" {...register('location')} placeholder="e.g. Remote / New York" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="experience">Experience (Years)</Label>
                    <Input
                        id="experience"
                        type="number"
                        {...register('experience', { valueAsNumber: true })}
                        placeholder="e.g. 5"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="salary">Salary Range</Label>
                    <Input id="salary" {...register('salary')} placeholder="e.g. $120k - $150k" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Input id="education" {...register('education')} placeholder="e.g. Bachelor's in Computer Science" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Describe the role and responsibilities..."
                    className="min-h-[100px]"
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                    id="requirements"
                    {...register('requirements')}
                    placeholder="List the key requirements..."
                    className="min-h-[100px]"
                />
                {errors.requirements && <p className="text-sm text-red-500">{errors.requirements.message}</p>}
            </div>

            <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex gap-2">
                    <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a skill and press Enter"
                    />
                    <Button type="button" onClick={addSkill} variant="secondary">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="pl-2 pr-1 py-1">
                            {skill}
                            <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="ml-1 hover:text-red-500"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
                {errors.skills && <p className="text-sm text-red-500">{errors.skills.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
};
