import Vue from 'vue';
import template from './NewMeeting.html';

export const NewMeeting = template(
  Vue.extend({
    data() {
      return {
        user: {
          ghUsername: '',
          ghId: 0,
          name: '',
          organization: ''
        },
        chairs: '',
        errorMessage: ''
      };
    },
    created: async function () {
      this.user = await fetch('/api/user').then((res) => res.ok ? res.json() : Promise.reject(res));
      this.chairs = this.user.ghUsername;
    },
    methods: {
      async newMeeting() {
        let res;

        try {
          res = await fetch('/meetings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chairs: this.chairs })
          })
            .then(resp => resp.ok ? resp.json() : Promise.reject(resp.json()));
        } catch (e) {
          this.errorMessage = e.message;
          return;
        }
        let { id } = res;
        document.location.href = '/meeting/' + id;
      }
    }
  })
);
