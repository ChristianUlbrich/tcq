<script setup lang="ts">
//! NEEDED
import draggable from 'vuedraggable';
import { request } from '../../ClientSocket';

const props = defineProps<{
  agenda: AgendaItem[];
}>();

const loading = ref(false);

async function reorderAgendaItems(e: any) {
  const { newIndex, oldIndex } = e;
  this.loading = true;
  try {
    await request('reorderAgendaItemRequest', {
      newIndex,
      oldIndex
    });
  } catch (e) {
    this.agenda.splice(oldIndex, 0, this.agenda.splice(newIndex, 1)[0]);
  } finally {
    this.loading = false;
    (this.$refs['drag-container'] as Vue).$el.classList.remove('dragging');
  }
}

async function deleteAgendaItem(index: number) {
  this.loading = true;
  try {
    await request('deleteAgendaItemRequest', {
      index
    });
  } finally {
    this.loading = false;
  }
}

function dragStart() {
  (this.$refs['drag-container'] as Vue).$el.classList.add('dragging');
}

async function createNewAgendaItem() {
  if (!this.newAgendaItem.name) return;

  if (this.newAgendaItem.timebox && !this.newAgendaItem.timebox.match(/^\d{0,3}$/)) {
    this.timeboxError = '???';
    return;
  }
  this.timeboxError = '';

  (this.$refs['create-button'] as Element).classList.toggle('is-loading');
  try {
    await request('newAgendaItemRequest', this.newAgendaItem);
    this.cancelForm();
  } catch (e) {
    this.errorMessage = e.message;
  } finally {
    (this.$refs['create-button'] as Element).classList.toggle('is-loading');
    this.loading = false;
  }
}

function showForm() {
  this.creating = true;
  this.newAgendaItem.ghUsername = this.$root.$data.user.ghUsername;
  Vue.nextTick(() => {
    (this.$refs['item-name-input'] as HTMLInputElement).focus();
  });
}

function cancelForm() {
  this.errorMessage = '';
  this.creating = false;
  this.newAgendaItem = { name: '' } as any;
}
</script>

<template>
  <section class=section ref="agenda">
    <draggable @end=reorderAgendaItems :options="{ disabled: loading || !$root.isChair }" @start=dragStart ref="drag-container">
      <div v-for="(item, index) of agenda" :key="item.id">
        <agenda-item :item=item :index=index @delete="deleteAgendaItem(index)"></agenda-item>
      </div>
    </draggable>
    <a @click=showForm class=new-agenda-item-link v-if="!creating && $root.isChair">+ New Agenda Item</a>
    <div class=new-agenda-item-form v-if="creating">
      <div class="header">New Agenda Item</div>
      <div class="field is-grouped">
        <div class="control agenda-item-control">
          <label class="label">Agenda Item Name</label>
          <input ref="item-name-input"
                 type=text class=input
                 v-model="newAgendaItem.name"
                 @keyup.enter=createNewAgendaItem
                 @keyup.esc=cancelForm>
          <div class="help is-danger" v-if="errorMessage">{{ errorMessage }}</div>
        </div>

        <div class="control owner-control">
          <label class="label">Owner</label>
          <input type=text class=input
                 v-model="newAgendaItem.ghUsername"
                 @keyup.enter=createNewAgendaItem
                 @keyup.esc=cancelForm>
          <div class="help">GitHub user name (omit the @)</div>
        </div>

        <div class="control timebox-control">
          <label class="label">Timebox</label>
          <input type=text :class="{ input: true, 'is-danger': timeboxError }"
                 v-model="newAgendaItem.timebox"
                 @keyup.enter=createNewAgendaItem
                 @keyup.esc=cancelForm>
          <div class="help" :class="{ help: true, 'is-danger': timeboxError }">
            {{ timeboxError || 'Minutes' }}
          </div>
        </div>

        <div class="control">
          <label class="label">&nbsp;</label>
          <button ref=create-button class="button is-primary"
                  @click="createNewAgendaItem"
                  v-bind:disabled="newAgendaItem.name.length === 0">Create</button>
          <button class="button is-danger" @click=cancelForm>Cancel</button>
        </div>
      </div>
    </div>
  </section>
</template>
