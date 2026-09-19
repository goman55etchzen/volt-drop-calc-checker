// src/composables/useDrum.ts
import { ref, type Ref } from 'vue';

/**
 * ドラム式（横スクロール・無限ループ）UIの選択状態とスクロール制御をまとめた composable。
 *
 * - selectedValue: 現在選択中の値
 * - next() / prev(): 無限ループで次・前の値へ移動
 * - selectValue(): クリック等で直接値を選択
 * - setItemRef(): v-for内の各アイテムのDOM要素を登録する（scrollIntoViewで使用）
 *
 * 値が変わるたびに、対応するDOM要素を scrollIntoView() でスクロール領域内の
 * 見える位置（デフォルトは中央）まで滑らかにスクロールさせる。
 * CSS側で `scroll-snap-type` を設定しておくと、スワイプ操作時のスナップと
 * ボタン操作時の scrollIntoView が両方とも同じ位置にピタッと揃う。
 */
export function useDrum<T>(
  options: T[],
  initialValue: T,
  scrollOptions: {
    /** scrollIntoViewでの横方向の合わせ位置。ボタンが左右にある場合は 'center' がおすすめ */
    inline?: ScrollLogicalPosition;
    /** trueにするとスクロール自体を行わない（CSSのscroll-snapのみに任せたい場合） */
    disableAutoScroll?: boolean;
  } = {}
) {
  const { inline = 'center', disableAutoScroll = false } = scrollOptions;

  const selectedValue = ref<T>(initialValue) as Ref<T>;

  // v-for内の各アイテムのDOM要素を保持する配列
  // テンプレート側では :ref="(el) => setItemRef(el, index)" のように登録する
  const itemRefs = ref<(HTMLElement | null)[]>([]);

  const setItemRef = (el: Element | { $el?: Element } | null, index: number) => {
    const node = (el && '$el' in el ? (el as { $el?: Element }).$el : el) as HTMLElement | null;
    itemRefs.value[index] = node ?? null;
  };

  // 現在選択中の値に対応するDOM要素までスムーズにスクロール
  const scrollToSelected = () => {
    if (disableAutoScroll) return;
    const idx = options.indexOf(selectedValue.value);
    const el = itemRefs.value[idx];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({
        behavior: 'smooth',
        inline,
        block: 'nearest',
      });
    }
  };

  const selectValue = (val: T) => {
    selectedValue.value = val;
    scrollToSelected();
  };

  // 次へ進む（端に達したら最初に戻る無限ループ）
  const next = () => {
    const idx = options.indexOf(selectedValue.value);
    const nextIdx = (idx + 1) % options.length;
    selectedValue.value = options[nextIdx];
    scrollToSelected();
  };

  // 前へ戻る（端に達したら最後尾に戻る無限ループ）
  const prev = () => {
    const idx = options.indexOf(selectedValue.value);
    const prevIdx = (idx - 1 + options.length) % options.length;
    selectedValue.value = options[prevIdx];
    scrollToSelected();
  };

  return {
    selectedValue,
    selectValue,
    next,
    prev,
    setItemRef,
    scrollToSelected,
  };
}
