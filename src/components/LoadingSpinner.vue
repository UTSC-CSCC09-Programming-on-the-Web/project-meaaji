<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'border-primary-600'
})

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
}
</script>

<template>
  <div :class="[sizeClasses[size], color]" class="animate-spin rounded-full border-2 border-t-transparent"></div>
</template>