import { defineComponent, h, type PropType } from "vue";

export const MAI_ACTION_BUTTON_TONES = {
  DEFAULT: "default",
  PRIMARY: "primary",
  DANGER: "danger",
} as const;

export type ActionButtonTone =
  (typeof MAI_ACTION_BUTTON_TONES)[keyof typeof MAI_ACTION_BUTTON_TONES];

export interface ActionButtonModel {
  key: string;
  label: string;
  tone?: ActionButtonTone;
  disabled?: boolean;
  onClick: () => void;
}

export interface ActionDetailItem {
  label: string;
  value: string;
}

function buttonClass(tone: ActionButtonTone): string {
  switch (tone) {
    case MAI_ACTION_BUTTON_TONES.PRIMARY:
      return "mai-action-button mai-action-button--primary";
    case MAI_ACTION_BUTTON_TONES.DANGER:
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
    eyebrow: {
      type: String,
      required: false,
      default: "",
    },
    subtitle: {
      type: String,
      required: false,
      default: "",
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
          <div class="mai-action-card__heading">
            {props.eyebrow ? (
              <p class="mai-action-card__eyebrow">{props.eyebrow}</p>
            ) : null}
            <h3 class="mai-action-card__title">{props.title}</h3>
            {props.subtitle ? (
              <p class="mai-action-card__subtitle">{props.subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            class="mai-action-card__close"
            onClick={() => emit("close")}
            aria-label={props.closeAriaLabel}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        {slots.default ? <div class="mai-action-card__body">{slots.default()}</div> : null}
      </section>
    );
  },
});

export const MaiActionDetailList = defineComponent({
  name: "MaiActionDetailList",
  props: {
    details: {
      type: Array as PropType<ActionDetailItem[]>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <dl class="mai-action-card__details">
        {props.details.map((detail) => (
          <div class="mai-action-card__detail" key={`${detail.label}-${detail.value}`}>
            <dt class="mai-action-card__detail-label">{detail.label}</dt>
            <dd class="mai-action-card__detail-value">{detail.value}</dd>
          </div>
        ))}
      </dl>
    );
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
            class={buttonClass(button.tone ?? MAI_ACTION_BUTTON_TONES.DEFAULT)}
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
