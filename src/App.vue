<template>
  <img src="./assets/logo.png">
  <div>{{ title }}</div>
</template>

<script>
import { ref } from 'vue'
export default {
  setup () {
    const title = ref('hello, setup')
    return {
      title
    }
  }
}
</script>
