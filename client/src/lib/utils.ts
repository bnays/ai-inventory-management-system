import { User } from "@/types/user";

export const userInitials = (user: User) => {
    if (!user?.firstName && !user?.lastName) return '??';
    
    const firstInitial = String(user?.firstName ?? 'User')?.[0] || '';
    const lastInitial = String(user?.lastName ?? 'User')?.[0] || '';
    
    return (firstInitial + lastInitial).toUpperCase();
};