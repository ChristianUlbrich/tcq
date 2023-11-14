<script setup lang="ts">
import { ref, toValue } from 'vue';
import axios from 'axios';

const meetingId = ref('');
const helpText = ref('4 characters');
const hasError = ref(false);

const joinMeeting = async function () {
  const mId = toValue(meetingId);
  console.log('MeetingId', mId);
  if (mId.length !== 4) {
    helpText.value = 'To restate: must be 4 characters';
    hasError.value = true;
    return;
  }

  // try {
  //   let res = await axios.head('/meeting/' + mId);
  // } catch (e) {
  //   if (e.response && e.response.status === 404) {
  //     helpText.value = 'Meeting not found';
  //     hasError.value = true;
  //     return;
  //   }
  // }

  // TODO: make this use the router instead of href...
  document.location.href = '/#/meeting/' + mId;
};
</script>
<template>
  <div>
    <div class="label">Meeting ID</div>
    <div class="field has-addons">
      <div class="control">
        <input
          class="input"
          type="text"
          size="5"
          maxlength="4"
          v-model="meetingId"
          v-bind:class="{ 'is-danger': hasError }"
          @keyup.enter="joinMeeting"
        />
      </div>
      <div class="control">
        <a class="button is-primary" @click="joinMeeting">Join</a>
      </div>
    </div>
    <div class="help" v-bind:class="{ 'is-danger': hasError }">{{ helpText }}</div>
  </div>
</template>
<style lang="scss">
@import 'bulma/bulma';
</style>
