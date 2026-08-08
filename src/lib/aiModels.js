export const AI_MODELS = {
    // Legacy Models (for backward compatibility)
    veo_3_1: {
        label: 'Veo 3.1 (Google) [Legacy]',
        modes: ['Text to Video', 'Image to Video'],
        aspectRatios: ['16:9', '9:16', '1:1'],
        maxImages: 1,
        category: 'video',
        workflow: 'veo_two_step'
    },
    nano_banana_pro: {
        label: 'Nano Banana Pro (Kie.ai) [Legacy]',
        modes: ['Text to Image', 'Image to Image'],
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
        maxImages: 2,
        category: 'image'
    },
    kling_3_0: {
        label: 'Kling 3.0 (Kuaishou) [Legacy]',
        modes: ['Text to Video', 'Image to Video'],
        aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
        maxImages: 2,
        category: 'video',
        supportsMotionControl: true,
        workflow: 'kling_motion'
    },
    
    // New v2 Models
    veo_3_1_v2: {
        label: 'Veo 3.1 (Google) [v2]',
        modes: ['Two-Step (Image Preview)'],
        aspectRatios: ['16:9', '9:16', '1:1'],
        maxImages: 1,
        category: 'video',
        workflow: 'veo_two_step' // Identifies the UI component to render
    },
    kling_3_0_v2: {
        label: 'Kling 3.0 (Kuaishou) [v2]',
        modes: ['Motion Control'],
        aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
        maxImages: 2,
        category: 'video',
        workflow: 'kling_motion'
    },
    seedance_2_fast_v2: {
        label: 'Seedance 2.0 Fast (Kie.ai) [v2]',
        modes: ['Seedance Multi-shot / Action'],
        aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'],
        maxImages: 9, // Seedance allows multiple reference images
        category: 'video',
        workflow: 'seedance_motion'
    },
    seedance_2_5_v2: {
        label: 'Seedance 2.5 (ByteDance / Kie.ai) [v2]',
        modes: ['Seedance 2.5 (4 Slots, Audio, 30s, 480p)'],
        aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', 'adaptive'],
        maxImages: 4,
        category: 'video',
        workflow: 'seedance_2_5'
    },
    nano_banana_pro_v2: {
        label: 'Nano Banana Pro (Kie.ai) [v2]',
        modes: ['Text to Image', 'Image to Image'],
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
        maxImages: 2,
        category: 'image',
        workflow: 'nano_image'
    }
};
