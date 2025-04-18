<script lang="ts">
  export let dataUrl: string;
  export let alt: string = 'QR Code';
  export let size: number = 200;
</script>

<div class="qrcode-container flex items-center justify-center">
  <img src={dataUrl} {alt} width={size} height={size} class="qrcode" />
</div>

<style>
  .qrcode {
    display: block;
    border-radius: 0.5rem;
  }
</style> 