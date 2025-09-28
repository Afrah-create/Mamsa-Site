// File Upload Handler for Supabase Storage

class FileUploadHandler {
    constructor() {
        this.supabase = window.supabaseClient;
        this.dbConfig = window.dbConfig;
    }

    async uploadFile(file, bucket = 'images', folder = '') {
        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = folder ? `${folder}/${fileName}` : fileName;

            // Upload file to Supabase Storage
            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                throw error;
            }

            // Get public URL
            const { data: urlData } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return {
                success: true,
                path: filePath,
                url: urlData.publicUrl,
                fileName: fileName
            };

        } catch (error) {
            console.error('Error uploading file:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteFile(filePath, bucket = 'images') {
        try {
            const { error } = await this.supabase.storage
                .from(bucket)
                .remove([filePath]);

            if (error) {
                throw error;
            }

            return { success: true };

        } catch (error) {
            console.error('Error deleting file:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async uploadImage(file, contentType = 'general') {
        const folder = this.getImageFolder(contentType);
        return await this.uploadFile(file, 'images', folder);
    }

    getImageFolder(contentType) {
        const folders = {
            news: 'news',
            events: 'events',
            leadership: 'leadership',
            gallery: 'gallery',
            general: 'general'
        };
        return folders[contentType] || 'general';
    }

    validateImageFile(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
            };
        }

        if (file.size > maxSize) {
            return {
                valid: false,
                error: 'Image size must be less than 5MB'
            };
        }

        return { valid: true };
    }

    async handleFormWithFileUpload(formData, contentType, itemId = null) {
        const data = {};
        let imageFile = null;
        let imageUrl = null;

        // Process form data
        for (let [key, value] of formData.entries()) {
            if (key === 'image') {
                imageFile = value;
                continue;
            }
            
            if (key === 'tags' && value) {
                data[key] = value.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else if (key === 'featured' || key === 'registration_required') {
                data[key] = formData.has(key);
            } else if (value) {
                data[key] = value;
            }
        }

        // Handle file upload if image is provided
        if (imageFile && imageFile.size > 0) {
            const validation = this.validateImageFile(imageFile);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const uploadResult = await this.uploadImage(imageFile, contentType);
            if (!uploadResult.success) {
                throw new Error(uploadResult.error);
            }

            imageUrl = uploadResult.url;
            data.image = imageUrl;
        }

        // Handle special cases
        if (contentType === 'leadership' && (data.facebook || data.twitter || data.linkedin)) {
            data.social_media = {
                facebook: data.facebook || '',
                twitter: data.twitter || '',
                linkedin: data.linkedin || ''
            };
            delete data.facebook;
            delete data.twitter;
            delete data.linkedin;
        }

        return data;
    }

    async updateContentWithImage(tableName, data, itemId) {
        try {
            if (itemId) {
                // Update existing item
                const { error } = await this.supabase
                    .from(tableName)
                    .update(data)
                    .eq('id', itemId);

                if (error) throw error;
                
                return { success: true, action: 'updated' };
            } else {
                // Create new item
                const { error } = await this.supabase
                    .from(tableName)
                    .insert([data]);

                if (error) throw error;
                
                return { success: true, action: 'created' };
            }
        } catch (error) {
            console.error(`Error ${itemId ? 'updating' : 'creating'} ${tableName}:`, error);
            throw error;
        }
    }

    async deleteContentWithImage(tableName, itemId, imageField = 'image') {
        try {
            // First, get the item to find the image path
            const { data: item, error: fetchError } = await this.supabase
                .from(tableName)
                .select(imageField)
                .eq('id', itemId)
                .single();

            if (fetchError) throw fetchError;

            // Delete the item
            const { error: deleteError } = await this.supabase
                .from(tableName)
                .delete()
                .eq('id', itemId);

            if (deleteError) throw deleteError;

            // Delete the associated image file if it exists
            if (item[imageField]) {
                const imagePath = this.extractImagePath(item[imageField]);
                if (imagePath) {
                    await this.deleteFile(imagePath, 'images');
                }
            }

            return { success: true };
        } catch (error) {
            console.error(`Error deleting ${tableName} item:`, error);
            throw error;
        }
    }

    extractImagePath(imageUrl) {
        if (!imageUrl) return null;
        
        try {
            const url = new URL(imageUrl);
            const pathParts = url.pathname.split('/');
            const bucketIndex = pathParts.indexOf('images');
            
            if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
                return pathParts.slice(bucketIndex + 1).join('/');
            }
        } catch (error) {
            console.error('Error extracting image path:', error);
        }
        
        return null;
    }

    showUploadProgress(file, progressCallback) {
        // This could be enhanced to show actual upload progress
        // For now, we'll just show a simple progress indicator
        if (progressCallback) {
            progressCallback(0);
            setTimeout(() => progressCallback(50), 500);
            setTimeout(() => progressCallback(100), 1000);
        }
    }

    async batchUploadFiles(files, contentType = 'general') {
        const results = [];
        const folder = this.getImageFolder(contentType);

        for (const file of files) {
            const validation = this.validateImageFile(file);
            if (!validation.valid) {
                results.push({
                    fileName: file.name,
                    success: false,
                    error: validation.error
                });
                continue;
            }

            const uploadResult = await this.uploadFile(file, 'images', folder);
            results.push({
                fileName: file.name,
                ...uploadResult
            });
        }

        return results;
    }

    getImageUrl(imagePath, bucket = 'images') {
        if (!imagePath) return null;
        
        const { data } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(imagePath);
            
        return data.publicUrl;
    }

    async listImages(bucket = 'images', folder = '') {
        try {
            const { data, error } = await this.supabase.storage
                .from(bucket)
                .list(folder, {
                    limit: 100,
                    offset: 0
                });

            if (error) throw error;

            return data.map(item => ({
                name: item.name,
                path: folder ? `${folder}/${item.name}` : item.name,
                url: this.getImageUrl(folder ? `${folder}/${item.name}` : item.name, bucket),
                size: item.metadata?.size,
                lastModified: item.updated_at
            }));

        } catch (error) {
            console.error('Error listing images:', error);
            return [];
        }
    }
}

// Initialize file upload handler
window.fileUploadHandler = new FileUploadHandler();
