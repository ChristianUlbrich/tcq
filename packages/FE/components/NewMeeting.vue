<script setup lang="ts">
// const props = defineProps < {
//   user: {
//     ghUsername: '',
//     ghId: 0,
//     name: '',
//     organization: ''
//   },
//   chairs: '',
//   errorMessage: ''
// } > ();

const res = ref(await useFetch('/api/user'));
const user = res.value.data;
const chairs = user?.ghUsername;

const errorMessage = ref('');

const newMeeting = async () => {
  let res: any;

  try {
    res = await fetch('/meetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ chairs })
    })
      .then(resp => resp.ok ? resp.json() : Promise.reject(resp.json()));
  } catch (e) {
    errorMessage.value = (e as Error).message;
    return;
  }
  document.location.href = `/meeting/${res.id}`;
};
</script>

<template>
  <div>
    <div class="field">
      <div class="control">
        <div class="label">Chairs</div>
        <input class=input v-model=chairs>
        <div :class="['help', errorMessage ? 'is-danger' : '']">
          <div v-if="errorMessage">
            {{ errorMessage }}
          </div>
          <div v-else>
            Chairs control the agenda and speaker queue. Enter GitHub user names separated by commas.
          </div>
        </div>
      </div>
    </div>

    <div class="field">
      <p class="control">
        <button class="button is-primary" @click=newMeeting>Start a New Meeting</button>
      </p>
    </div>
  </div>
</template>
