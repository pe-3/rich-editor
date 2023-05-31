<template>
  <div id="app">
    <div class="wrapper about-textarea">
      <rich-text-editor placeholder="开启你的富文本编辑之旅">
        <!-- 自定义富文本操作面板 -->
        <div slot="op" class="op" slot-scope="{operator: {setHead, setStrong, setDelete}}">
          <span @click="setHead(1)">h1</span>
          <span @click="setStrong">B</span>
          <span @click="setDelete">D</span>
        </div>
      </rich-text-editor>
    </div>
  </div>
</template>

<script>
import RichTextEditor from './template/RichTextEditor'
export default {
  name: 'App',
  components: {
    RichTextEditor,
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
}
.wrapper {
  position: absolute;
  top: 50%;
  width: 70%;
  height: 80vh;
  border: 1px solid #555;
  border-bottom: 0px;
  padding: 5px 10px;
}
.tip {
  color: #999;
  font-size: 14px;
  margin-top: -30px;
  margin-bottom: 10px;
}
.about-textarea {
  left: 50%;
  transform: translate(-50%, -50%);
}
.op span {
  border: 1px solid #777;
  padding: 0 5px;
  cursor: pointer;
}
.op {
  border-bottom: 1px solid #999;
  padding-bottom: 10px;
  margin-bottom: 10px;
}
</style>
