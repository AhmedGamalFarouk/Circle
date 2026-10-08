import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase-config";
import cloudinaryService from "../../services/cloudinaryService";
export async function uploadAndSendImage(file, circleId, userId, userName, replyTo, onProgress, formatTime, photoURL) {
    try {
        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadImage(file, onProgress, {
            folder: `circles/${circleId}/images`,
            tags: ['chat', 'image', circleId]
        });

        // Send message to Firestore
        const messageData = {
            messageType: "image",
            user: {
                userId: userId,
                imageurl: photoURL || "",
                userName: userName
            },
            sentTime: formatTime(),
            imageUrl: uploadResult.secure_url,
            mediaUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            fileName: file.name,
            fileSize: file.size,
            width: uploadResult.width,
            height: uploadResult.height,
            mimeType: file.type,
            timestamp: serverTimestamp(),
            timeStamp: serverTimestamp(),
            replyTo: replyTo ? {
                id: replyTo.id,
                userName: replyTo.user?.userName ?? null,
                text: replyTo.text ?? null, // Use null if text is missing
                messageType: replyTo.messageType ?? null,
                audioUrl: replyTo.audioUrl || null,
                imageUrl: replyTo.imageUrl || null,
                videoUrl: replyTo.videoUrl || null,
            } : null,
        };

        const docRef = await addDoc(collection(db, "circles", circleId, "chat"), messageData);

        return {
            messageId: docRef.id,
            uploadResult,
            ...messageData
        };
    } catch (error) {
        console.error('Error uploading and sending image:', error);
        throw error;
    }
}

export async function uploadAndSendAudio(audioBlob, duration, circleId, userId, userName, replyTo, onProgress, formatTime, photoURL) {
    try {
        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadAudio(audioBlob, onProgress, {
            folder: `circles/${circleId}/audio`,
            tags: ['chat', 'voice', 'audio', circleId]
        });

        // Send message to Firestore
        const messageData = {
            messageType: "audio",
            user: {
                userId: userId,
                imageurl: photoURL || "",
                userName: userName
            },
            sentTime: formatTime(),
            audioUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            duration: Math.round(duration),
            fileSize: audioBlob.size,
            mimeType: uploadResult.format ? `audio/${uploadResult.format}` : 'audio/webm',
            timestamp: serverTimestamp(),
            timeStamp: serverTimestamp(),
            replyTo: replyTo ? {
                id: replyTo.id,
                userName: replyTo.user?.userName ?? null,
                text: replyTo.text ?? null, // Use null if text is missing
                messageType: replyTo.messageType ?? null,
                audioUrl: replyTo.audioUrl || null,         // ✅ preserve media refs
                imageUrl: replyTo.imageUrl || null,
                videoUrl: replyTo.videoUrl || null,
            } : null,
        };
        const docRef = await addDoc(collection(db, "circles", circleId, "chat"), messageData);
        return {
            messageId: docRef.id,
            uploadResult,
            ...messageData
        };
    } catch (error) {
        console.error('Error uploading and sending audio:', error);
        throw error;
    }
}

export async function uploadAndSendVideo(file, circleId, userId, userName, replyTo, onProgress, formatTime, photoURL) {
    try {
        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadVideo(file, onProgress, {
            folder: `circles/${circleId}/videos`,
            tags: ['chat', 'video', circleId]
        });
        console.log("ReplyTo being passed:", replyTo);

        // Send message to Firestore
        const messageData = {
            messageType: "video",
            user: {
                userId: userId,
                imageurl: photoURL || "",
                userName: userName
            },
            sentTime: formatTime(),
            videoUrl: uploadResult.secure_url,
            mediaUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            fileName: file.name,
            fileSize: file.size,
            duration: uploadResult.duration,
            width: uploadResult.width,
            height: uploadResult.height,
            mimeType: file.type,
            timestamp: serverTimestamp(),
            timeStamp: serverTimestamp(),
            replyTo: replyTo ? {
                id: replyTo.id,
                userName: replyTo.user?.userName ?? null,
                text: replyTo.text ?? null, // Use null if text is missing
                messageType: replyTo.messageType ?? null,
                audioUrl: replyTo.audioUrl || null,         // ✅ preserve media refs
                imageUrl: replyTo.imageUrl || null,
                videoUrl: replyTo.videoUrl || null,
            } : null,
        };

        const docRef = await addDoc(collection(db, "circles", circleId, "chat"), messageData);

        return {
            messageId: docRef.id,
            uploadResult,
            ...messageData
        };
    } catch (error) {
        console.error('Error uploading and sending video:', error);
        throw error;
    }
}

export async function batchUploadImages(files, circleId, userId, userName, replyTo, onProgress, formatTime) {
    try {
        const results = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Update overall progress
            if (onProgress) {
                onProgress(i + 1, files.length);
            }

            // Upload individual file
            const result = await uploadAndSendImage(
                file,
                circleId,
                userId,
                userName,
                i === 0 ? replyTo : null, // Only apply reply to first image
                null, // No individual progress for batch
                formatTime
            );

            results.push(result);
        }

        return results;
    } catch (error) {
        console.error('Error batch uploading images:', error);
        throw error;
    }
}

export function getOptimizedImageUrl(publicId, options = {}) {
    const {
        width = 'auto',
        height = 'auto',
        quality = 'auto',
        crop = 'fill',
        format = 'auto'
    } = options;

    const transformations = {
        w: width,
        h: height,
        q: quality,
        c: crop,
        f: format
    };

    return getCloudinaryUrl(publicId, transformations);
}


export function getThumbnailUrl(publicId, size = 150) {
    return getOptimizedImageUrl(publicId, {
        width: size,
        height: size,
        crop: 'thumb',
        quality: 'auto'
    });
}

export function getVideoThumbnailUrl(publicId) {
    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}`;
    return `${baseUrl}/video/upload/so_0,w_300,h_200,c_fill,q_auto,f_jpg/${publicId}.jpg`;
}

// Re-export cloudinary config for URL generation
import CLOUDINARY_CONFIG, { getCloudinaryUrl } from '../../config/cloudinary.js';
