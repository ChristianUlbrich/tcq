import Vue from 'vue';
import template from './JoinMeeting.html';

export const JoinMeeting = template(
  Vue.extend({
    data: function () {
      return {
        meetingId: '',
        helpText: '4 characters',
        hasError: false
      };
    },

    methods: {
      async joinMeeting() {
        if (this.meetingId.length !== 4) {
          this.helpText = 'To restate: must be 4 characters';
          this.hasError = true;
          return;
        }

        let res = await fetch(`/meeting/${this.meetingId}`);

        if (!res.ok) {
          this.helpText = 'Meeting not found';
          this.hasError = true;
          return;
        }

        document.location.href = '/meeting/' + this.meetingId;
      }
    }
  })
);
