import { computed } from "vue";
const props = withDefaults(defineProps(), {
    size: "md",
});
const totalGems = computed(() => {
    switch (props.format) {
        case "BO1":
            return 1;
        case "BO3":
            return 2;
        case "BO5":
            return 3;
        case "BO7":
            return 4;
        default:
            return 2;
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    size: "md",
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2.5" },
    ...{ class: (__VLS_ctx.side === 'right' ? 'flex-row' : 'flex-row-reverse') },
});
for (const [index] of __VLS_getVForSourceType((__VLS_ctx.totalGems))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        key: (index),
        ...{ class: "rounded-sm transform rotate-45 transition-all duration-500 shadow-md" },
        ...{ class: ([
                __VLS_ctx.size === 'lg' ? 'w-5.5 h-5.5' : 'w-5 h-5',
                index <= __VLS_ctx.score
                    ? 'gem-active border-2 border-white'
                    : 'gem-inactive border-2 border-slate-600'
            ]) },
    });
}
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['rotate-45']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-500']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            totalGems: totalGems,
        };
    },
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=GemPoints.vue.js.map