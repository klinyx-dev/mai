import { defineComponent, h, type PropType } from "vue";

export type ActionButtonTone = "default" | "primary" | "danger";

export interface ActionButtonModel {
  key: string;
  label: string;
  tone?: ActionButtonTone;
  disabled?: boolean;
  onClick: () => void;
}

function buttonClass(tone: ActionButtonTone): string {
  switch (tone) {
    case "primary":
      return "mai-action-button mai-action-button--primary";
    case "danger":
      return "mai-action-button mai-action-button--danger";
    default:
      return "mai-action-button";
  }
}

export const MaiActionCard = defineComponent({
  name: "MaiActionCard",
  props: {
    title: {
      type: String,
      required: true,
    },
    closeAriaLabel: {
      type: String,
      required: true,
    },
  },
  emits: {
    close: () => true,
  },
  setup(props, { emit, slots }) {
    return () => (
      <section class="mai-action-card">
        <header class="mai-action-card__header">
          <h3 class="mai-action-card__title">{props.title}</h3>
          <button
            type="button"
            class="mai-action-card__close"
            onClick={() => emit("close")}
            aria-label={props.closeAriaLabel}
          >
            x
          </button>
        </header>
        {slots.default ? slots.default() : null}
      </section>
    );
  },
});

export const MaiActionMetaList = defineComponent({
  name: "MaiActionMetaList",
  props: {
    lines: {
      type: Array as PropType<string[]>,
      required: true,
    },
  },
  setup(props) {
    return () =>
      props.lines.map((line) => (
        <p class="mai-action-card__meta" key={line}>
          {line}
        </p>
      ));
  },
});

export const MaiActionButtons = defineComponent({
  name: "MaiActionButtons",
  props: {
    buttons: {
      type: Array as PropType<ActionButtonModel[]>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="mai-action-card__actions">
        {props.buttons.map((button) => (
          <button
            type="button"
            class={buttonClass(button.tone ?? "default")}
            disabled={button.disabled}
            onClick={button.onClick}
            key={button.key}
          >
            {button.label}
          </button>
        ))}
      </div>
    );
  },
});
