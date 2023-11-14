<script setup lang="ts">
import { ref, toValue } from 'vue';
import axios from 'axios';

const errorMessage = ref('');
// TODO: populate via router.js
const chairs = ref((window as any).user?.ghUsername ?? '');

const newMeeting = async function () {
  let res;

  try {
    res = await axios.post('/meetings', {
      chairs: toValue(chairs),
    });
  } catch (e) {
    errorMessage.value = e.response.data.message;
    return;
  }
  // TODO: hook up with router... instead of directly modifying href :)
  let { id } = res.data;
  document.location.href = '/#/meeting/' + id;
};
</script>
<template>
  <div>
    <div class="field">
      <div class="control">
        <div class="label">Chairs</div>
        <input class="input" v-model="chairs" />
        <div :class="['help', errorMessage ? 'is-danger' : '']">
          <div v-if="errorMessage">{{ errorMessage }}</div>
          <div v-else>Chairs control the agenda and speaker queue. Enter GitHub user names separated by commas.</div>
        </div>
      </div>
    </div>

    <div class="field">
      <p class="control">
        <button class="button is-primary" @click="newMeeting">Start a New Meeting</button>
      </p>
    </div>
  </div>
</template>

<style lang="scss">
@import '../../node_modules/bulma/bulma';
</style>
