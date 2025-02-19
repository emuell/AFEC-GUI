import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import '@vaadin/icons';
import '@vaadin/icon';

import '@vaadin/vaadin-lumo-styles/vaadin-iconset.js';

// -------------------------------------------------------------------------------------------------

// Shows a message along with an error icon

@customElement('afec-error-message')
export class ErrorMessage extends LitElement {

  @property()
  type: "info" | "error" = "error";

  @property()
  message: string = "Unknown error";

  static styles = css`
    #layout {
      height: 100%; 
      align-items: center; 
      justify-content: center; 
    }
  `;

  render() {
    const iconColor = (this.type === "error")
      ? "--lumo-error-text-color"
      : "--lumo-primary-text-color";
    const errorIcon = html`
      <vaadin-icon 
        icon="lumo:error" 
        style="color: var(${iconColor}); width:64px; height:64px">
      </vaadin-icon>`;
    return html`
      <vaadin-horizontal-layout id="layout">
        ${errorIcon}${this.message}
      </vaadin-horizontal-layout>
    `;
  }
}

// -------------------------------------------------------------------------------------------------

declare global {
  interface HTMLElementTagNameMap {
    'afec-error-message': ErrorMessage
  }
}
