<script lang="ts">
    let { color1 = "hsl(315, 100%, 72%)", color2 = "hsl(227, 100%, 50%)" } = $props();
    
    // Generate unique ID to prevent gradient conflicts when multiple books are rendered
    const idSuffix = Math.random().toString(36).slice(2);
    const gradientId = `cover-gradient-${idSuffix}`;
    const filterId = `cover-filter-${idSuffix}`;

    // Generate random noise texture properties
    const randomFreqX = (Math.random() * 0.008 + 0.002).toFixed(4);
    const randomFreqY = (Math.random() * 0.008 + 0.002).toFixed(4);
    const baseFreq = `${randomFreqX} ${randomFreqY}`;
    const seed = Math.floor(Math.random() * 100);
</script>

<div class="relative w-full h-full flex flex-col justify-end overflow-hidden">
    <!-- SVG Background -->
    <svg class="absolute inset-0 w-full h-full object-cover transition-transform duration-4000 group-hover:scale-150" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700">
        <defs>
            <linearGradient gradientTransform="rotate(150, 0.5, 0.5)" x1="50%" y1="0%" x2="50%" y2="100%" id={gradientId}>
                <stop stop-color={color1} stop-opacity="1" offset="0%"></stop>
                <stop stop-color={color2} stop-opacity="1" offset="100%"></stop>
            </linearGradient>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                <feTurbulence type="fractalNoise" baseFrequency={baseFreq} numOctaves="2" seed={seed} stitchTiles="stitch" x="0%" y="0%" width="100%" height="100%" result="turbulence"></feTurbulence>
                <feGaussianBlur stdDeviation="20 0" x="0%" y="0%" width="100%" height="100%" in="turbulence" edgeMode="duplicate" result="blur"></feGaussianBlur>
                <feBlend mode="color-dodge" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" in2="blur" result="blend"></feBlend>
            </filter>
        </defs>
        <rect width="700" height="700" fill="url(#{gradientId})" filter="url(#{filterId})"></rect>
    </svg>
</div>
