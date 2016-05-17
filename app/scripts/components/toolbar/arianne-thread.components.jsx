import React from 'react';
import Lifespan from 'lifespan';
import LocalClient from '~/stores/local-client.stores.jsx';

export default class ArianneThread extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			families: [],
			selection: {
				family: {},
				variant: {},
			},
		};
	}

	async componentWillMount() {
		this.client = LocalClient.instance();
		this.lifespan = new Lifespan();
		const families = await this.client.fetch('/fontLibrary');
		const fontVariant = await this.client.fetch('/fontVariant');

		this.client.getStore('/fontLibrary', this.lifespan)
			.onUpdate(({head}) => {
				this.setState({
					families: head.toJS().fonts,
				});
			})
			.onDelete(() => {
				this.setState({
					families: undefined,
				});
			});

		this.client.getStore('/fontVariant', this.lifespan)
			.onUpdate(({head}) => {
				this.setState({
					selection: head.toJS(),
				});
			})
			.onDelete(() => {
				this.setState({
					selection: undefined,
				});
			});

		this.setState({
			families: families.head.toJS().fonts,
			selection: fontVariant.head.toJS(),
		});
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	selectVariant(variant, family) {
		this.client.dispatchAction('/select-variant', {variant, family});
	}

	selectFamily(family) {
		this.client.dispatchAction('/select-variant', {variant: undefined, family});
	}

	render() {
		const variantFamily = _.find(this.state.families, (family) => {
			return family.name === this.state.selection.family.name;
		});

		const variants = variantFamily
			? variantFamily.variants
			: [];

		return (
			<div className="arianne-thread">
				<RootArianneItem />
				<DropArianneItem
					label={this.state.selection.family.name}
					list={this.state.families}
					click={this.selectFamily.bind(this)}/>
				<DropArianneItem
					label={this.state.selection.variant.name}
					family={this.state.selection.family}
					variant={this.state.selection.variant}
					list={variants}
					click={this.selectVariant.bind(this)}/>
				<ActionArianneItem label="group" img="assets/images/arianne-plus.svg"/>
			</div>
		);
	}
}

class RootArianneItem extends React.Component {
	render() {
		return (
			<div className="arianne-item is-small">
				<div className="arianne-item-action is-small">
					<img className="arianne-item-action-collection" src="assets/images/collection.svg"/>
				</div>
				<div className="arianne-item-arrow"></div>
			</div>
		);
	}
}

class DropArianneItem extends React.Component {

	render() {
		return (
			<div className="arianne-item">
				<div className="arianne-item-action">
					{this.props.label}
					<img className="arianne-item-action-drop arianne-item-action-img" src="assets/images/drop.svg"/>
				</div>
				<div className="arianne-item-arrow"></div>
				<ArianneDropMenu
					list={this.props.list}
					click={this.props.click}
					family={this.props.family}
				/>
			</div>
		);
	}
}

class ArianneDropMenu extends React.Component {
	render() {
		const items = this.props.list.map((item) => {
			return <ArianneDropMenuItem item={item} key={item.name} click={this.props.click} family={this.props.family}/>;
		});

		return (
			<ul className="arianne-drop-menu">
				{items}
			</ul>
		);
	}
}

class ArianneDropMenuItem extends React.Component {
	render() {
		return (
			<li className="arianne-drop-menu-item" onClick={() => {
				this.props.click(this.props.item, this.props.family);
			}}>
				{this.props.item.name}
			</li>
		);
	}
}

class ActionArianneItem extends React.Component {
	render() {
		return (
			<div className="arianne-item">
				<div className="arianne-item-action">
					{this.props.label}
					<img className="arianne-item-action-plus arianne-item-action-img" src={this.props.img}/>
				</div>
				<div className="arianne-item-arrow"></div>
			</div>
		);
	}
}