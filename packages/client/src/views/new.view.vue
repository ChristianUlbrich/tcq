<script lang="ts">
import NewMeeting from '../components/new-meeting.component.vue';
import JoinMeeting from '../components/join-meeting.component.vue';

export default {
  components: { NewMeeting, JoinMeeting },
};
</script>
<template>
  <!--display=block hack to make always visible on mobile -->
  <nav class="navbar" role="navigation" aria-label="main navigation" style="display: block">
    <div class="navbar-brand">
      <a class="navbar-item" href="/" id="tcq-logo">TCQ</a>
      <span style="flex-grow: 1"></span>
      <a href="/logout" class="navbar-item">Log Out</a>
    </div>
  </nav>
  <section class="section">
    <div class="columns">
      <div class="column is-6">
        <div class="box">
          <div class="title is-4">Join Meeting</div>
          <div id="join-meeting">
            <JoinMeeting></JoinMeeting>
          </div>
        </div>
      </div>
      <div class="column is-6">
        <div class="box">
          <div class="title is-4">New Meeting</div>
          <div id="new-meeting">
            <NewMeeting></NewMeeting>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<style lang="scss">
$navbar-background-color: #fed;
$navbar-item-hover-background-color: lighten($navbar-background-color, 10%);
@import 'bulma/bulma';
@import '../styles/navbar.scss';

.box {
  min-height: 200px;
}
</style>
