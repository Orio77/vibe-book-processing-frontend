<script lang="ts">
    import { settingsStore, getFontFamilyString } from '$lib/stores/settings.svelte';
    import type { TextWidth, ScrollMode, FontFamily } from '$lib/stores/settings.svelte';
    import { fade, fly } from 'svelte/transition';
    import Dropdown from './Dropdown.svelte';

    const fontOptions: { value: FontFamily; label: string }[] = [
        { value: 'default', label: 'Default' },
        { value: 'literata', label: 'Literata' },
        { value: 'verdana', label: 'Verdana' },
        { value: 'helvetica', label: 'Helvetica' },
        { value: 'opendyslexic', label: 'OpenDyslexic' },
    ];

    const textWidthOptions: { value: TextWidth; label: string }[] = [
        { value: 'narrow', label: 'Narrow' },
        { value: 'medium', label: 'Medium' },
        { value: 'wide', label: 'Wide' },
    ];

    const scrollOptions: { value: ScrollMode; label: string }[] = [
        { value: 'vertical', label: 'Vertical' },
        { value: 'horizontal', label: 'Horizontal' },
    ];
    
    let activeTab: 'reader' | 'llm' = $state('reader');

    function closeDropdown() {
        (document.activeElement as HTMLElement)?.blur();
    }
</script>

<Dropdown contentClass="!fixed !top-20 !left-1/2 !-translate-x-1/2 !w-[95vw] sm:!absolute sm:!top-full sm:!left-auto sm:!right-0 sm:!translate-x-0 sm:!w-80 max-w-[360px] p-5 space-y-5 select-none">
    {#snippet trigger()}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="hidden md:inline">Settings</span>
        <svg width="12px" height="12px" class="inline-block h-2 w-2 fill-current opacity-60"
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
            <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
    {/snippet}

    {#snippet content()}

        <!-- Tab Switcher -->
        <div role="tablist" class="tabs tabs-boxed bg-base-200 rounded-lg">
            <button
                role="tab"
                class="tab {activeTab === 'reader' ? 'tab-active' : ''}"
                onclick={() => activeTab = 'reader'}
            >
                Reading
            </button>
            <button
                role="tab"
                class="tab {activeTab === 'llm' ? 'tab-active' : ''}"
                onclick={() => activeTab = 'llm'}
            >
                AI Features
            </button>
        </div>

        <div class="grid overflow-hidden">
        {#if activeTab === 'reader'}
            <div class="space-y-5 col-start-1 row-start-1" out:fly={{ duration: 200, y: 10 }} in:fly={{ duration: 300, y: -10, delay: 200 }}>
                <!-- Font family -->
                <div class="space-y-2">
                    <span class="text-sm font-semibold text-base-content">Font</span>
                    <div class="flex flex-wrap gap-2">
                        {#each fontOptions as opt (opt.value)}
                            <button
                                class="btn btn-sm {settingsStore.fontFamily === opt.value ? 'btn-primary' : 'btn-ghost border-base-300'}"
                                style="font-family: {getFontFamilyString(opt.value)};"
                                onclick={() => settingsStore.setFontFamily(opt.value)}
                            >
                                {opt.label}
                            </button>
                        {/each}
                    </div>
                </div>

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
            </div>
        {:else}
            <div class="space-y-5 col-start-1 row-start-1" out:fly={{ duration: 200, y: 10 }} in:fly={{ duration: 300, y: -10, delay: 200 }}>
                <!-- LLM API Key Override Toggle -->
                <div class="space-y-2">
                    <label class="label cursor-pointer p-0">
                        <span class="text-sm font-semibold text-base-content">Override with offline API Key</span>
                        <input
                            type="checkbox"
                            class="toggle toggle-primary toggle-sm"
                            checked={settingsStore.forceOfflineLlm}
                            onchange={(e) => settingsStore.setForceOfflineLlm(e.currentTarget.checked)}
                        />
                    </label>
                    <p class="text-xs text-base-content/60">
                        Normally in online mode it uses the server. Enable this to switch to the API key below.
                    </p>
                </div>

                <!-- LLM API Key -->
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-base-content" for="settings-llm-api-key">
                        LLM API Key
                    </label>
                    <input
                        id="settings-llm-api-key"
                        type="password"
                        autocomplete="off"
                        placeholder="sk-..."
                        value={settingsStore.llmApiKey}
                        oninput={(e) => settingsStore.setLlmApiKey(e.currentTarget.value)}
                        class="input input-sm input-bordered w-full"
                    />
                </div>

                <!-- LLM Base URL -->
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-base-content" for="settings-llm-base-url">
                        LLM Base URL
                    </label>
                    <input
                        id="settings-llm-base-url"
                        type="url"
                        placeholder="https://generativelanguage.googleapis.com/v1beta/openai/"
                        value={settingsStore.llmBaseUrl}
                        oninput={(e) => settingsStore.setLlmBaseUrl(e.currentTarget.value)}
                        class="input input-sm input-bordered w-full"
                    />
                </div>

                <!-- LLM Model -->
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-base-content" for="settings-llm-model">
                        LLM Model
                    </label>
                    <input
                        id="settings-llm-model"
                        type="text"
                        placeholder="gpt-4o-mini"
                        value={settingsStore.llmModel}
                        oninput={(e) => settingsStore.setLlmModel(e.currentTarget.value)}
                        class="input input-sm input-bordered w-full"
                    />
                </div>
            </div>
        {/if}
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
            <button class="btn btn-primary btn-sm" onclick={closeDropdown}>
                Done
            </button>
        </div>
    {/snippet}
</Dropdown>
