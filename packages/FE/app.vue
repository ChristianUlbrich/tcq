<script setup lang="ts">
// useClientSocket();
</script>


<template>
  <nav class="navbar" role="navigation" aria-label="main navigation" style="display: block;">
    <div class="navbar-brand">
      <a class="navbar-item" href="/" id=tcq-logo>TCQ</a>
      <button class="button navbar-burger" @click="toggleMenu">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="navbar-menu" ref="menu">
        <!-- add is-active here when clicking hamburger-->
        <div class="navbar-start">
          <a class="navbar-item" @click="showAgenda">Agenda</a>
          <a class="navbar-item is-active" @click="showQueue">Queue</a>
        </div>
        <div class="navbar-end">
          <a href="/login" class=navbar-item>Log In</a>
          <a href="/logout" class=navbar-item>Log Out</a>
        </div>
      </div>
    </div>
  </nav>

  <section class=section>
    <NuxtPage />
  </section>
</template>

<style lang="scss">
@use "~/assets/scss/main.scss";
</style>
