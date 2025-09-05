/**
 * Schema Health Check Utility
 * Validates database schema alignment with application expectations
 */
import { supabase } from './supabase';

export class SchemaHealthCheck {
    /**
     * Check if tables referenced by the app exist in the database
     * Run this early in app initialization to detect schema issues
     */
    static async validateTables(): Promise<{ valid: boolean, issues: string[] }> {
        const issues: string[] = [];
        let valid = true;

        try {
            // Check if 'issues' table exists (primary table for app)
            const { data: issuesCheck, error: issuesError } = await supabase
                .from('issues')
                .select('id')
                .limit(1);

            if (issuesError) {
                valid = false;
                issues.push('Table "issues" not found. This is required for the app to function.');
                console.warn('⚠️ Schema warning: "issues" table not found:', issuesError.message);

                // Check if 'civic_issues' exists instead
                const { data: civicIssuesCheck, error: civicIssuesError } = await supabase
                    .from('civic_issues')
                    .select('id')
                    .limit(1);

                if (!civicIssuesError) {
                    issues.push('Using "civic_issues" table, but app is configured for "issues". This may cause issues.');
                    console.warn('⚠️ Schema warning: "civic_issues" table exists but app uses "issues". Run complete-schema-final.sql to fix.');
                } else {
                    issues.push('Neither "issues" nor "civic_issues" tables found. The app will not function correctly.');
                    console.error('❌ Schema error: Neither "issues" nor "civic_issues" tables found.');
                }
            }

            // Check if community_posts exists (for community features)
            const { error: communityPostsError } = await supabase
                .from('community_posts')
                .select('id')
                .limit(1);

            if (communityPostsError) {
                issues.push('Community feature tables are missing. Community features will not work.');
                console.warn('⚠️ Schema warning: "community_posts" table not found. Run complete-schema-final.sql to add community features.');
            }

            // Check for self-reference columns that caused previous errors
            if (!issuesError) {
                // Test issue_comments self-reference
                const { error: commentsError } = await supabase
                    .from('issue_comments')
                    .select('id, parent_comment_id')
                    .limit(1);

                if (commentsError) {
                    issues.push('The issue_comments table has problems. Reply features may not work.');
                    console.warn('⚠️ Schema warning: issue_comments table error:', commentsError.message);
                }

                // Test community_posts self-reference
                const { error: postsError } = await supabase
                    .from('community_posts')
                    .select('id, parent_post_id')
                    .limit(1);

                if (postsError) {
                    issues.push('The community_posts table has problems. Reply features may not work.');
                    console.warn('⚠️ Schema warning: community_posts table error:', postsError.message);
                }
            }

            return { valid, issues };
        } catch (error) {
            console.error('Error running schema health check:', error);
            return {
                valid: false,
                issues: ['Failed to run schema health check. Database connection may be unavailable.']
            };
        }
    }

    /**
     * Create compatibility views if needed
     * This should be used with caution, preferably in development
     */
    static async createCompatibilityView(): Promise<boolean> {
        try {
            // Create a view if issues doesn't exist but civic_issues does
            const { data, error } = await supabase.rpc(
                'execute_sql',
                {
                    sql: `
            DO $$
            BEGIN
              IF to_regclass('public.civic_issues') IS NOT NULL AND to_regclass('public.issues') IS NULL THEN
                EXECUTE 'CREATE OR REPLACE VIEW public.issues AS SELECT * FROM public.civic_issues';
                RAISE NOTICE 'Created compatibility view "issues" pointing to "civic_issues"';
              END IF;
              
              IF to_regclass('public.issues') IS NOT NULL AND to_regclass('public.civic_issues') IS NULL THEN
                EXECUTE 'CREATE OR REPLACE VIEW public.civic_issues AS SELECT * FROM public.issues';
                RAISE NOTICE 'Created compatibility view "civic_issues" pointing to "issues"';
              END IF;
            END $$;
          `
                }
            );

            if (error) {
                console.error('Failed to create compatibility view:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error creating compatibility view:', error);
            return false;
        }
    }

    /**
     * Fix common schema issues that can be addressed at runtime
     * This should be used with caution, preferably in development
     */
    static async attemptSchemaFix(): Promise<boolean> {
        try {
            const { valid, issues } = await this.validateTables();

            if (valid) {
                console.log('✅ Schema validation passed, no fixes needed');
                return true;
            }

            console.log('⚠️ Attempting to fix schema issues:', issues);

            // Try to create compatibility views
            await this.createCompatibilityView();

            // Validate again to see if fixes worked
            const { valid: fixedValid, issues: remainingIssues } = await this.validateTables();

            if (fixedValid) {
                console.log('✅ Schema issues fixed successfully');
                return true;
            } else {
                console.error('❌ Schema issues remain after fix attempt:', remainingIssues);
                return false;
            }
        } catch (error) {
            console.error('Error fixing schema:', error);
            return false;
        }
    }
}

export default SchemaHealthCheck;
