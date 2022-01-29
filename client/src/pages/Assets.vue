<template>
  <q-page class=" q-pa-md " >
    <wf-title :title='title' :caption='caption' />

    <q-card-section style='max-width: 600px'>
      <q-table
        :data=' assets '
        :columns=' assets_view '
        :rows-per-page-options="[10]"
      >
        <q-td slot="body-cell-actions" slot-scope="props" :props="props">
          <q-btn size='xs' round color="primary" icon="visibility"
            @click.stop='viewAsset(props.row)'  />
          &nbsp;
          <q-btn size='xs' round color="primary" icon="assignment"
            @click.stop='registerTicker(props.row)'  />
          &nbsp;
          <q-btn size='xs' round color="primary" icon="outbound"
            @click.stop='removeDeposit(props.row)'  />
        </q-td>
      </q-table>
    </q-card-section>
    <q-banner v-if='unitURL' dense inline-actions class="text-white bg-green-4"> 
      Request submitted. Unit:&nbsp;
      <a :href="unitURL" style="color: white;" target="explorer">{{unit}}</a>
      <template v-slot:action >
        <q-btn flat icon='cancel' @click.stop='closeOKBanner'/>
      </template>
    </q-banner>
  </q-page>
</template>

<script>
import api from 'src/services/api'
import notify from 'src/components/shared/messages/notify'

export default {
  name: 'AdminPage',

  data () {
    return {
      title: 'Obyte Headless Wallet Assets',
      caption: 'Assets issued by your Headless Wallet.',
      hwObyteNet: `https://${(process.env.DEV ? 'testnet': '')}explorer.obyte.org/#`,
      unitURL: null,
      unit: null,
      assets_view: [
        { name: 'actions', label: '', align: 'left', field: 'unit'},
        { name: 'unit', required: true, label: 'Asset Unit Id', align: 'right', field: 'unit', classes: 'mono' },
      ],
      assets: []
    }
  },

  methods: {
    async getAssets () {
      try {
        const response = await api().get('assets/')
        if (response.status === 200) {
          this.assets = response.data
        }
      }
      catch (err) { notify.processError(err) }
    },

    async viewAsset (asset) {
      let assetURL = this.hwObyteNet + asset.unit
      window.open(assetURL, 'obyteAsset');
    },
    async registerTicker (asset) {
      const ticker = prompt('Insert ticker name');
      const description = prompt('Insert description');
      const decimals = prompt('Insert decimals');
      if (ticker == null) return;
      if (!ticker) return alert('Ticker name is required.');
      if (description == null) return;
      if (!description) return alert('Description is required.');
      if (decimals == null) return;
      if (decimals == '') return alert('Decimals is required.');

      const payload = {
        symbol: ticker,
        description: description,
        decimals: decimals,
        asset: asset.unit
      }
      try {
        this.unit = null 
        this.unitURL = null
        const response = await api().post('assets/register', payload)
        if (response.status === 201) {
          //let message = 'Transferred. Unit: ' + response.data.unit
          //notify.success(message)
          this.unit = response.data.unit
          this.unitURL = this.hwObyteNet + response.data.unit
        }
      }
      catch (err) {
        notify.processError(err) }
    },
    async removeDeposit (asset) {
      const ticker = prompt('Insert ticker name');
      if (ticker == null) return;
      if (!ticker) return alert('Ticker name is required.');

      const payload = {
        symbol: ticker,
        asset: asset.unit
      }
      try {
        this.unit = null 
        this.unitURL = null
        const response = await api().post('assets/remove-deposit', payload)
        if (response.status === 201) {
          //let message = 'Transferred. Unit: ' + response.data.unit
          //notify.success(message)
          this.unit = response.data.unit
          this.unitURL = this.hwObyteNet + response.data.unit
        }
      }
      catch (err) {
        notify.processError(err) }
    },

    closeOKBanner () {
      this.unit = null 
      this.unitURL = null
    }
  },

  async mounted () {
    await this.getAssets();
  },

  components: {
    'wf-title': require('components/shared/headers/Title.vue').default,
  }

}
</script>
<style>
.mono { font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace; }
</style>
