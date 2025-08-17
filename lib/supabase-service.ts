import * as FileSystem from 'expo-file-system';
import { CivicIssue, IssueCategory, IssueInsert, IssueStatus, IssueUpdate } from '../types';
import { supabase } from './supabase';

export class SupabaseService {

    // ISSUE MANAGEMENT

    /**
     * Create a new civic issue (supports anonymous reporting)
     */
    static async createIssue(issueData: IssueInsert): Promise<CivicIssue | null> {
        try {
            const { data, error } = await supabase
                .from('issues')
                .insert([issueData])
                .select()
                .single();

            if (error) {
                console.error('Error creating issue:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Failed to create issue:', error);
            return null;
        }
    }

    /**
     * Create an anonymous issue (no authentication required)
     */
    static async createAnonymousIssue(issueData: Omit<IssueInsert, 'reporter_id' | 'is_anonymous'>): Promise<CivicIssue | null> {
        try {
            const anonymousIssueData = {
                ...issueData,
                reporter_id: null,
                is_anonymous: true,
            };

            // Debug: Log the data being sent
            console.log('Anonymous issue data being sent:', JSON.stringify(anonymousIssueData, null, 2));
            console.log('Category value:', `"${anonymousIssueData.category}"`);
            console.log('Category type:', typeof anonymousIssueData.category);

            const { data, error } = await supabase
                .from('issues')
                .insert([anonymousIssueData])
                .select()
                .single();

            if (error) {
                console.error('Error creating anonymous issue:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Failed to create anonymous issue:', error);
            return null;
        }
    }

    /**
     * Get all issues with optional filters
     */
    static async getIssues(filters?: {
        category?: IssueCategory;
        priority?: 'Low' | 'Medium' | 'High';
        status?: IssueStatus;
        limit?: number;
        offset?: number;
    }): Promise<CivicIssue[]> {
        try {
            let query = supabase
                .from('issues')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters?.category) {
                query = query.eq('category', filters.category);
            }
            if (filters?.priority) {
                query = query.eq('priority', filters.priority);
            }
            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.limit) {
                query = query.limit(filters.limit);
            }
            if (filters?.offset) {
                query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching issues:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Failed to fetch issues:', error);
            return [];
        }
    }

    /**
     * Get a single issue by ID
     */
    static async getIssueById(issueId: string): Promise<CivicIssue | null> {
        try {
            const { data, error } = await supabase
                .from('issues')
                .select('*')
                .eq('id', issueId)
                .single();

            if (error) {
                console.error('Error fetching issue:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Failed to fetch issue:', error);
            return null;
        }
    }

    /**
     * Update an issue (for officers)
     */
    static async updateIssue(issueId: string, updates: IssueUpdate): Promise<CivicIssue | null> {
        try {
            const updateData = {
                ...updates,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('issues')
                .update(updateData)
                .eq('id', issueId)
                .select()
                .single();

            if (error) {
                console.error('Error updating issue:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Failed to update issue:', error);
            return null;
        }
    }

    /**
     * Update issue status (for officers)
     */
    static async updateIssueStatus(issueId: string, status: IssueStatus): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('issues')
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', issueId);

            if (error) {
                console.error('Error updating issue status:', error);
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Failed to update issue status:', error);
            return false;
        }
    }

    /**
     * Get issues by reporter (for citizens to see their reports)
     * Only returns authenticated user's issues, not anonymous ones
     */
    static async getIssuesByReporter(reporterId: string): Promise<CivicIssue[]> {
        try {
            const { data, error } = await supabase
                .from('issues')
                .select('*')
                .eq('reporter_id', reporterId)
                .eq('is_anonymous', false)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching user issues:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Failed to fetch user issues:', error);
            return [];
        }
    }

    /**
     * Get all public issues (includes anonymous reports for public viewing)
     */
    static async getPublicIssues(filters?: {
        category?: IssueCategory;
        priority?: 'Low' | 'Medium' | 'High';
        status?: IssueStatus;
        limit?: number;
        offset?: number;
    }): Promise<CivicIssue[]> {
        try {
            let query = supabase
                .from('issues')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters?.category) {
                query = query.eq('category', filters.category);
            }
            if (filters?.priority) {
                query = query.eq('priority', filters.priority);
            }
            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.limit) {
                query = query.limit(filters.limit);
            }
            if (filters?.offset) {
                query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching public issues:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Failed to fetch public issues:', error);
            return [];
        }
    }

    // IMAGE STORAGE

    /**
     * Upload an image to Supabase Storage
     */
    static async uploadImage(imageUri: string, issueId: string, fileName: string): Promise<string | null> {
        const maxRetries = 3;
        let lastError: any = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Uploading image attempt ${attempt}/${maxRetries}:`, fileName);

                // Convert image URI to Blob using FileSystem (robust across platforms)
                const info = await FileSystem.getInfoAsync(imageUri);
                if (!info.exists) {
                    throw new Error(`Image file not found at URI: ${imageUri}`);
                }

                // Read file as base64, then convert to Blob via data URL (avoids fetch(file://) issues)
                const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
                // Best-effort MIME detection
                const lower = (imageUri.split('?')[0] || '').toLowerCase();
                const ext = lower.substring(lower.lastIndexOf('.') + 1);
                const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'heic' ? 'image/heic' : 'image/jpeg';
                const dataUrl = `data:${mime};base64,${base64}`;
                const dataResp = await fetch(dataUrl);
                const blob = await dataResp.blob();
                console.log(`Image blob created successfully (via data URL), size: ${blob.size} bytes, type: ${blob.type}`);

                // Create file path
                const filePath = `${issueId}/${fileName}`;

                // Upload to Supabase Storage with timeout and retry logic
                const { data, error } = await supabase.storage
                    .from('issue-images')
                    .upload(filePath, blob, {
                        contentType: blob.type || 'image/jpeg',
                        upsert: false
                    });

                if (error) {
                    console.error(`Upload attempt ${attempt} failed:`, error);
                    lastError = error;

                    // If it's the last attempt, throw the error
                    if (attempt === maxRetries) {
                        throw error;
                    }

                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    continue;
                }

                console.log('Image uploaded successfully:', data);

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('issue-images')
                    .getPublicUrl(filePath);

                console.log('Public URL generated:', urlData.publicUrl);
                return urlData.publicUrl;

            } catch (error) {
                console.error(`Upload attempt ${attempt} failed:`, error);
                lastError = error;

                // If it's the last attempt, break the loop
                if (attempt === maxRetries) {
                    break;
                }

                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }

        console.error('All upload attempts failed:', lastError);
        return null;
    }

    /**
     * Upload multiple images for an issue
     */
    static async uploadMultipleImages(
        imageUris: string[],
        issueId: string
    ): Promise<string[]> {
        const uploadPromises = imageUris.map(async (uri, index) => {
            const fileName = `image_${index + 1}_${Date.now()}.jpg`;
            return this.uploadImage(uri, issueId, fileName);
        });

        try {
            const results = await Promise.all(uploadPromises);
            return results.filter(url => url !== null) as string[];
        } catch (error) {
            console.error('Failed to upload multiple images:', error);
            return [];
        }
    }

    /**
     * Delete an image from storage
     */
    static async deleteImage(imageUrl: string): Promise<boolean> {
        try {
            // Extract file path from URL
            const url = new URL(imageUrl);
            const pathSegments = url.pathname.split('/');
            const filePath = pathSegments.slice(-2).join('/'); // Get last two segments (issueId/filename)

            const { error } = await supabase.storage
                .from('issue-images')
                .remove([filePath]);

            if (error) {
                console.error('Error deleting image:', error);
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Failed to delete image:', error);
            return false;
        }
    }

    // ANALYTICS & STATISTICS

    /**
     * Get issue statistics for dashboard
     */
    static async getIssueStats(): Promise<{
        total: number;
        byStatus: Record<IssueStatus, number>;
        byCategory: Record<IssueCategory, number>;
        byPriority: Record<string, number>;
    }> {
        try {
            const { data, error } = await supabase
                .from('issues')
                .select('status, category, priority');

            if (error) {
                console.error('Error fetching issue stats:', error);
                throw error;
            }

            const total = data?.length || 0;
            const byStatus: Record<IssueStatus, number> = {
                'Pending': 0,
                'In Progress': 0,
                'Resolved': 0,
            };
            const byCategory: Record<IssueCategory, number> = {
                'Roads': 0,
                'Sanitation': 0,
                'Electricity': 0,
                'Water Supply': 0,
                'Public Safety': 0,
                'Others': 0,
            };
            const byPriority: Record<string, number> = {
                'Low': 0,
                'Medium': 0,
                'High': 0,
            };

            data?.forEach(issue => {
                byStatus[issue.status as IssueStatus]++;
                byCategory[issue.category as IssueCategory]++;
                byPriority[issue.priority]++;
            });

            return { total, byStatus, byCategory, byPriority };
        } catch (error) {
            console.error('Failed to fetch issue stats:', error);
            return {
                total: 0,
                byStatus: { 'Pending': 0, 'In Progress': 0, 'Resolved': 0 },
                byCategory: { 'Roads': 0, 'Sanitation': 0, 'Electricity': 0, 'Water Supply': 0, 'Public Safety': 0, 'Others': 0 },
                byPriority: { 'Low': 0, 'Medium': 0, 'High': 0 },
            };
        }
    }

    // REAL-TIME SUBSCRIPTIONS

    /**
     * Subscribe to new issues (for officer dashboard)
     */
    static subscribeToIssues(callback: (payload: any) => void) {
        return supabase
            .channel('issues')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'issues',
                },
                callback
            )
            .subscribe();
    }

    /**
     * Subscribe to issue status updates for a specific user
     */
    static subscribeToUserIssues(userId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`user_issues_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'issues',
                    filter: `reporter_id=eq.${userId}`,
                },
                callback
            )
            .subscribe();
    }
}

export default SupabaseService;
