import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { PanelButton } from "../components/controls/panel-button/panel-button"

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Components/PanelButton',
  component: PanelButton,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    handleClick: { action: () => {console.log('awesome')} },
  },
} as ComponentMeta<typeof PanelButton>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof PanelButton> = (args) => <PanelButton {...args} />;

export const Selected = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Selected.args = {
  enabled: true,
  label: 'Selected',
};

export const Unselected = Template.bind({});
Unselected.args = {
    enabled: true,
    label: 'Unselected',
};

export const Disabled = Template.bind({});
Disabled.args = {
  enabled: false,
};
