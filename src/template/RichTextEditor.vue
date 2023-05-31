<template>
  <div class="rich-text-editor2" @click="focus">
    <slot name="op" :operator="operator"></slot>
    <textarea 
      :value="content"
      class="hide-input"
      :style="textareaPos"
      ref="myTextarea"
      :rows="3"
      @blur="onBlur"
      @input="onInput"
      @keydown="onKeyDown"
    ></textarea>
    <!-- placeholder -->
    <div class="line-text place-holder" v-if="contents.length === 1 && contents[0] === '' && placeholder">
      <p>{{ placeholder }}</p>
    </div>
    <!-- 渲染的行数 -->
    <div 
      v-for="(c, i) in contents" 
      :key="i" 
      class="line-text" 
      ref="renderRefs"
      :class="richTextObject[i] || []"
    >
      <!-- 光标模式，sectionStart 和 end 一样 -->
      <p v-if="!isSelection">{{ c.slice(0, curEdit.insert) }}<span 
        v-show="curEdit.line === i" 
        class="cursor" 
        :class="{show: isFocus, blink: !isEditing}"
      ></span>{{ c.slice(curEdit.insert) }}</p>
      <!-- 选中模式 -->
      <template v-else>
        <!-- 没选中 -->
        <p v-if="judgeSection(i) === 'no-selection'">{{ c }}</p>
        <!-- 选中一部分 -->
        <p v-if="judgeSection(i) === 'has-selection'">{{ c.slice(0, getLineSection(i)[0]) }}<span class="selection-area">{{ c.slice(...getLineSection(i)) }}</span>{{ c.slice(getLineSection(i)[1]) }}</p>
        <!-- 全选中 -->
        <p v-if="judgeSection(i) === 'all-selection'" class="selection-area">{{ c }}</p>
      </template>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs, ref, computed } from 'vue'
import { debounce } from '@/utils'
const debounced = debounce((func) => {
    func()
}, 500);
export default {
  name: 'rich-text-editor',
  props:{ 
    placeholder: {
      type: String,
      required: true
    }
  },
  setup() {
    // 编辑状态和编辑内容
    const state = reactive({
        isFocus: false, // 是否聚焦
        isEditing: false, // 是否正在编辑，如果是，展示动画，否则关掉
        content: '', // 和 textarea 绑定
    });

    // 光标状态
    const selection = reactive({
      selectionStart: 0,
      selectionEnd: 0,
    });
    // 实时监听光标状态
    const onKeyDown = (ev) => {
      // 实时获取光标信息
      setTimeout(() => {
        const {selectionStart, selectionEnd} = ev.target;
        selection.selectionStart = selectionStart;
        selection.selectionEnd = selectionEnd; 
      });
    }
    // 是否是选中的状态
    const isSelection = computed(() => {
      return selection.selectionStart !== selection.selectionEnd;
    });

    // 根据光标状态计算当前编辑的行数，从而控制虚拟光标的显示
    const getCurrentLineNumber = () => {
      const {selectionStart} = selection;
      const textBeforeCursor = state.content.substring(0, selectionStart);
      const linesBeforeCursor = textBeforeCursor.split('\n');
      return linesBeforeCursor.length - 1;
    }

    // 获取当前行光标插入的位置
    const getCurrentInsert = () => {
      const {selectionStart} = selection;
      const textBeforeCursor = state.content.substring(0, selectionStart);
      const linesBeforeCursor = textBeforeCursor.split('\n');
      return linesBeforeCursor.pop().length;      
    } 

    // 当前的编辑信息，当前行，光标位置
    const curEdit = computed(() => {
      return {
        line: getCurrentLineNumber(),
        insert: getCurrentInsert(),
      };
    })

    const myTextarea = ref();
    // 虚拟编辑器点击可以聚焦输入框
    const focus = () => {
      myTextarea.value?.focus();
      state.isFocus = true;
    }
    
    const onBlur = () => {
      state.isFocus = false;
    }

    // 输入事件，监听 input 可以读取拼音输入
    const onInput = (ev) => {
      state.content = ev.target.value;
      state.curLine = getCurrentLineNumber();
      // 编辑的时候光标不闪烁
      state.isEditing = true;
      debounced(() => {
        state.isEditing = false;
      })
    }

    // 根据 textarea 生成每一行展示的内容
    const contents = computed(() => {
      return state.content.split('\n');
    });

    const renderRefs = ref();
    // 真实输入框的位置和当前编辑行高度一致，保证打字时拼音在虚拟光标的下方
    const textareaPos = computed(() => {
      const curLine = curEdit.value.line;
      if(!renderRefs.value) return {};
      const curLineEle = renderRefs?.value[curLine];
      if(!curLineEle) return {}
      const {offsetLeft, offsetTop} = curLineEle;
      return {
        left: parseInt(offsetLeft) + 'px',
        top: parseInt(offsetTop + 5) + 'px'
      }
    })

    // 判断当前行是否有选中
    const judgeSection = (i) => {
      const preTotalLines = i ? (contents.value.slice(0, i).join('\n').length + 1) : 0;
      const totalLines = contents.value.slice(0, i + 1).join('\n').length;
      if(totalLines <= selection.selectionStart || preTotalLines >= selection.selectionEnd) {
        return 'no-selection';
      }
      else if(
        (preTotalLines >= selection.selectionStart && totalLines <= selection.selectionEnd)
      ){
        return 'all-selection';
      }
      else {
        return 'has-selection';
      }
    }
    
    // 返沪当前行的选中区域
    const getLineSection = (i) => {
      const preTotalLines = i ? (contents.value.slice(0, i).join('\n').length + 1) : 0;
      const totalLines = contents.value.slice(0, i + 1).join('\n').length;
      const {selectionStart, selectionEnd} = selection;
      let start, end;
      if(preTotalLines >= selectionStart) start = 0;
      else start = selectionStart - preTotalLines;

      if(totalLines <= selectionEnd) end = totalLines - preTotalLines;
      else end = selectionEnd - preTotalLines;

      return [start, end + 1];
    }

    // 富文本对象
    const richTextObject = reactive({});

    // 给行添加样式
    const addLineClass = (className) => {
      const curLine = curEdit.value.line;
      if(!richTextObject[curLine]) richTextObject[curLine] = [];
      richTextObject[curLine].push(className);
    };

    // 给行移除样式，并返回移除是否
    const removeLineClass = (className) => {
      const curLine = curEdit.value.line;
      if(!richTextObject[curLine]) return false;
      const classIndex = richTextObject[curLine].indexOf(className);
      classIndex > -1 && richTextObject[curLine].splice(classIndex, 1);
      return classIndex > -1;
    }

    // 没有就添加，有就删除
    const toggleClass = (className) => {
      if(!removeLineClass(className)) addLineClass(className);
    }

    // 富文本功能，用 slot 暴露给用户，用户可以自定义富文本操作面板
    // TODO: 实现默认面板
    const operator = {
      setHead: (i) => {
        toggleClass('head-' + i);
      },
      setStrong: () => {
        toggleClass('strong');
      },
      setDelete: () => {
        toggleClass('delete');
      }
    }

    return {
        ...toRefs(state),
        myTextarea,
        focus,
        onBlur,
        onInput,
        onKeyDown,
        // 调试信息
        contents,
        state,
        curEdit,
        selection,
        renderRefs,
        textareaPos,
        isSelection,
        judgeSection,
        getLineSection,
        operator,
        richTextObject
    }
  },
}
</script>

<style scoped>
.rich-text-editor2 {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding:2px;
  cursor:text;
  white-space: pre-wrap;
  position: relative;
  /* 相对定位，保证 input 定位不受外界影响 */
}
.hide-input {
  opacity: 0;
  position: absolute;
}
@keyframes blink {
  0% {
    opacity: 0;
  }
  20% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  80% {
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}
.cursor { 
  display: none;
  height: 1em;
  width: 1px;
  background-color: black;
  vertical-align: middle;
}
.blink {
  animation: blink 1s infinite;
}
.show {
  display: inline-block;
}
.line-text {
  padding-left: 5px;
}

.line-text p {
  min-height: 1em;
}
.place-holder {
  color: #999;
  position: absolute;
}
.selection-area {
  /* background-color: ; */
  background: #DAE6FF;
}

/* 富文本样式 */
.head-1 {
  font-weight: bolder;
  font-size: 26px;
  line-height: 1.4;
}
.strong {
  font-weight: bolder;
}
.delete {
  text-decoration: line-through;
}
</style>
