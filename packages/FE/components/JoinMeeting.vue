<script setup lang="ts">
const meetingId = ref('');
const hasError = ref(false);
const helpText = ref('');

const joinMeeting = async () => {
  if (meetingId.value.length !== 4) {
    helpText.value = 'To restate: must be 4 characters';
    hasError.value = true;
    return;
  }

  const res = await fetch(`/meeting/${meetingId}`);

  if (!res.ok) {
    helpText.value = 'Meeting not found';
    hasError.value = true;
    return;
  }

  document.location.href = `/meeting/${meetingId}`;
};
</script>

<template>
  <div>
    <div class="label">Meeting ID</div>
    <div class="field has-addons">
      <div class="control">
        <input
               class=input type=text size=5 maxlength=4
               v-model=meetingId
               v-bind:class="{ 'is-danger': hasError }"
               @keyup.enter=joinMeeting>
      </div>
      <div class="control">
        <a class="button is-primary" @click=joinMeeting>Join</a>
      </div>
    </div>
    <div class="help" v-bind:class="{ 'is-danger': hasError }">{{ helpText }}</div>
  </div>
</template>
