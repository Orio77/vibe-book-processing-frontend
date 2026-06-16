<script lang="ts">
    import { settingsStore } from '$lib/stores/settings.svelte';
    import type { TextWidth, ScrollMode } from '$lib/stores/settings.svelte';

    let open = $state(false);

    function toggle() {
        open = !open;
    }

    function close() {
        open = false;
    }

    const textWidthOptions: { value: TextWidth; label: string }[] = [
        { value: 'narrow', label: 'Narrow' },
        { value: 'medium', label: 'Medium' },
        { value: 'wide', label: 'Wide' },
    ];

    const scrollOptions: { value: ScrollMode; label: string }[] = [
        { value: 'vertical', label: 'Vertical' },
        { value: 'horizontal', label: 'Horizontal' },
    ];
</script>

{#if open}
    <div class="fixed inset-0 z-40" onclick={close} onkeydown={(e) => e.key === 'Escape' && close()}></div>
{/if}

<div class="relative">
    <button class="btn btn-ghost btn-sm gap-1" onclick={toggle}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Settings
        <svg width="12px" height="12px" class="inline-block h-2 w-2 fill-current opacity-60"
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
            <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
    </button>

    {#if open}
        <div class="absolute right-0 top-full mt-2 z-50 w-80 bg-base-100 border border-base-200 rounded-2xl shadow-2xl p-5 space-y-5">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-base-content">Reader View Settings</h3>
                <button class="btn btn-ghost btn-sm btn-circle" onclick={close}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <hr class="border-base-200" />

            <!-- Font size -->
            <div class="space-y-2">
                <label class="text-sm font-semibold text-base-content" for="settings-font-size">
                    Font size ({settingsStore.fontSize}px)
                </label>
                <input
                    id="settings-font-size"
                    type="range"
                    min="12"
                    max="32"
                    step="1"
                    value={settingsStore.fontSize}
                    oninput={(e) => settingsStore.setFontSize(Number(e.currentTarget.value))}
                    class="range range-primary range-sm w-full"
                />
            </div>

            <!-- Line spacing -->
            <div class="space-y-2">
                <label class="text-sm font-semibold text-base-content" for="settings-line-spacing">
                    Line spacing ({settingsStore.lineSpacing.toFixed(1)})
                </label>
                <input
                    id="settings-line-spacing"
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={settingsStore.lineSpacing}
                    oninput={(e) => settingsStore.setLineSpacing(Number(e.currentTarget.value))}
                    class="range range-primary range-sm w-full"
                />
            </div>

            <!-- Text width -->
            <div class="space-y-2">
                <span class="text-sm font-semibold text-base-content">Text width</span>
                <div class="flex gap-2">
                    {#each textWidthOptions as opt (opt.value)}
                        <button
                            class="btn btn-sm flex-1 {settingsStore.textWidth === opt.value ? 'btn-primary' : 'btn-ghost border-base-300'}"
                            onclick={() => settingsStore.setTextWidth(opt.value)}
                        >
                            {opt.label}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Scrolling -->
            <div class="space-y-2">
                <span class="text-sm font-semibold text-base-content">Scrolling</span>
                <div class="flex gap-2">
                    {#each scrollOptions as opt (opt.value)}
                        <button
                            class="btn btn-sm flex-1 {settingsStore.scrollMode === opt.value ? 'btn-primary' : 'btn-ghost border-base-300'}"
                            onclick={() => settingsStore.setScrollMode(opt.value)}
                        >
                            {opt.label}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Page flipping -->
            <div class="space-y-2">
                <span class="text-sm font-semibold text-base-content">Page flipping</span>
                <div class="flex gap-2">
                    <button
                        class="btn btn-sm {settingsStore.pageFlipping ? 'btn-primary' : 'btn-ghost border-base-300'}"
                        onclick={() => settingsStore.setPageFlipping(true)}
                    >
                        Enabled
                    </button>
                    <button
                        class="btn btn-sm {!settingsStore.pageFlipping ? 'btn-primary' : 'btn-ghost border-base-300'}"
                        onclick={() => settingsStore.setPageFlipping(false)}
                    >
                        Disabled
                    </button>
                </div>
            </div>

            <hr class="border-base-200" />

            <!-- Footer -->
            <div class="flex items-center justify-between">
                <button
                    class="btn btn-ghost btn-sm text-base-content/60 underline"
                    onclick={() => settingsStore.resetToDefaults()}
                >
                    Reset to defaults
                </button>
                <button class="btn btn-primary btn-sm" onclick={close}>
                    Done
                </button>
            </div>
        </div>
    {/if}
</div>
