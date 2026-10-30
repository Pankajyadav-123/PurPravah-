import { CircleHelp, Construction, Droplets, Trash2, Zap } from 'lucide-react';

export const departments = ['roads', 'electricity', 'sanitation', 'water', 'general'];

export const categories = [
    { value: 'road_damage', label: 'Road damage', icon: Construction },
    { value: 'electricity', label: 'Electricity', icon: Zap },
    { value: 'garbage', label: 'Garbage & sanitation', icon: Trash2 },
    { value: 'water_leakage', label: 'Water leakage', icon: Droplets },
    { value: 'other', label: 'Something else', icon: CircleHelp },
];

export const statusLabels = {
    under_verification: 'Under verification', assigned: 'Assigned', in_progress: 'In progress', resolved: 'Resolved', rejected: 'Not accepted',
};

export const departmentNames = { roads: 'Roads', electricity: 'Electricity', sanitation: 'Sanitation', water: 'Water', general: 'General services' };

export const statusTone = {
    under_verification: { backgroundColor: '#fff0d9', color: '#8b5a19' }, assigned: { backgroundColor: '#e7f0eb', color: '#2d675a' },
    in_progress: { backgroundColor: '#e0edf1', color: '#356575' }, resolved: { backgroundColor: '#e4efe2', color: '#426c3d' }, rejected: { backgroundColor: '#f6e5e2', color: '#9b4c44' },
};
