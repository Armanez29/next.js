import FilterButton from '../../components/FilterButton';

export default {
  title: 'Filter Button',
  component: FilterButton
};

export const NamedButton = Object.assign(() => <FilterButton name="Button"/>, {
  test: async (browser, {component}) => {
    // The component must be visible
    await expect(component).to.be.visible;
    // The component must contain the text "Button"
    await expect(component).text.to.contain('Button');
  }
});

export const ClickedButton = Object.assign(() => <FilterButton name="Filter" setFilter={() => {}} isPressed={true}/>, {
  async test(browser, {component}) {
    // Get Pressed value from button
    const isPressed = await component.getAttribute('aria-pressed');

    await expect(isPressed).to.equal('true');

    // The component must contain the text "Filter"
    await expect(component).text.to.contain('Filter');
  }
});
