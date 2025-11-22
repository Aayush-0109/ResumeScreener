import type { Job } from '../../../api/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Briefcase, DollarSign, Clock, Edit2, Trash2, Zap } from 'lucide-react';

interface JobCardProps {
    job: Job;
    onEdit: () => void;
    onDelete: () => void;
    onMatch: () => void;
}

export const JobCard = ({ job, onEdit, onDelete, onMatch }: JobCardProps) => {
    return (
        <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                            {job.title}
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground gap-2">
                            <Clock className="h-3 w-3" />
                            <span>Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-3 space-y-4">
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    {job.location && (
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                        </div>
                    )}
                    {job.experience !== undefined && (
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            <Briefcase className="h-3 w-3" />
                            {job.experience} years
                        </div>
                    )}
                    {job.salary && (
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            <DollarSign className="h-3 w-3" />
                            {job.salary}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Required Skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {job.skills.slice(0, 5).map((skill, index) => (
                            <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                                {skill}
                            </Badge>
                        ))}
                        {job.skills.length > 5 && (
                            <Badge variant="outline" className="text-muted-foreground">
                                +{job.skills.length - 5} more
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-3 flex gap-2 justify-end border-t bg-gray-50/50">
                <Button variant="ghost" size="sm" onClick={onEdit} className="text-gray-500 hover:text-blue-600">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={onDelete} className="text-gray-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                </Button>
                <Button size="sm" onClick={onMatch} className="ml-auto bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90">
                    <Zap className="h-4 w-4 mr-1 fill-current" />
                    Run Match
                </Button>
            </CardFooter>
        </Card>
    );
};
