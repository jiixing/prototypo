import React from 'react';
import {SubscriptionService} from '../services/subscriptions.services.js';
import HoodieApi from '../services/hoodie.services.js';
import Lifespan from 'lifespan';
import RemoteClient from '../stores/remote-client.stores.jsx';

import SubscriptionWidget from './subscription-widget.components.jsx';
import SubscriptionPurchase from './subscription-purchase.components.jsx';
import CardsWidget from './cards-widget.components.jsx';
import WaitForLoad from './wait-for-load.components.jsx';

export default class Subscriptions extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			cards:[],
			subscriptions:[],
			error:{
				code:{},
			},
			loaded:false,
			cardLoaded:false,
			subLoaded:false,
		};
	}

	async componentWillMount() {
		this.lifespan = new Lifespan();
		this.client = RemoteClient.clients.subscription;
		this.storeName = RemoteClient.storesList.subscription;

		this.connect();
	}

	async connect() {
		try {
			const store = await this.client.fetch(this.storeName);

			this.setState(store.head.toJS());
			this.setState({
				cardLoaded:true,
				subLoaded:true,
				loaded:true,
			});

			this.client.getStore(this.storeName,this.lifespan)
				.onUpdate(({head}) => {
					this.setState(head.toJS());
					this.setState({
						cardLoaded:true,
						subLoaded:true,
						loaded:true,
					});
				})
				.onDelete(() => {
					this.setState(undefined);
				});
		}
		catch (error) {
			if (error.status !== 404) {
				console.error(`Don't go here please`);
			}
		}
	}

	deleteCard(cardId) {
		this.setState({
			cardLoaded:false,
		});
		const data = {
			path,
			hoodieId:HoodieApi.instance.hoodieId,
			cardId,
			customerId:this.state.customerId,
		}
		this.client.dispatchAction('/remove-source',data);
	}

	addCard({cardNumber, year, month, cvc}) {
		const client = this.client;
		const storeName = this.storeName;
		const data = {
			path:storeName,
			hoodieId: HoodieApi.instance.hoodieId,
			email:HoodieApi.instance.email,
		};

		this.setState({
			cardLoaded:false,
		});

		Stripe.card.createToken({
			number: cardNumber,
			cvc: cvc,
			exp_month: month,
			exp_year: year,
		}, (status, response) => {
			if (response.error) {
				this.setState({
					error:response.error,
					cardLoaded:true,
				});
			}
			else {
				data.token = response.id;
				if (this.state.customerId) {
					data.customerId = this.state.customerId;
					client.dispatchAction('/add-source', data);
				} else {
					client.dispatchAction('/add-customer', data);
				}
			}
		});
	}

	subscribe(amount) {
		const path = this.storeName;
		this.setState({
			subLoaded:false,
		});
		this.client.dispatchAction('/pwyw-subscription',{
			path,
			customerId: this.state.customerId,
			amount,
		});
	}

	subscribeWithCoupon(coupon) {
		const path = this.storeName;
		this.setState({
			subLoaded:false,
		});

		this.client.dispatchAction('/coupon-sub', {
			path,
			customerId: this.state.customerId,
			coupon,
		});
	}

	unsubscribe(subscriptionId) {
		const path = this.storeName;
		this.setState({
			subLoaded:false,
		})
		const data = {
			path,
			subscriptionId,
			customerId:this.state.customerId,
			end:false,
		}

		this.client.dispatchAction('/remove-subscription',data);
	}

	changeCard(cardId,{cardNumber, year, month, cvc}) {
		const path = this.storeName;
		this.setState({
			cardLoaded:false,
		});
		const data = {
			path,
			cardId,
			customerId: this.state.customerId,
		};

		const client = this.client;

		return new Promise((resolve, reject) => {
			Stripe.card.createToken({
				number: cardNumber,
				cvc: cvc,
				exp_month: month,
				exp_year: year,
			}, (status, response) => {
				if (response.error) {
					this.setState({
						error:response.error,
						cardLoaded:true,
					});
					reject();
				}
				else {
					data.token = response.id;
					client.dispatchAction('/change-source', data);
					resolve();
				}
			});
		})
	}

	render() {
		if (process.env.__SHOW_RENDER__) {
			console.log('[RENDER] Subscriptions');
		}
		let content;
		if (this.state.subscriptions.length) {

			const subs = _.map(this.state.subscriptions, (sub) => {
				return (<SubscriptionWidget
					subscription={sub}
					unsubscribe={(id) => { this.unsubscribe(id); }}
					loaded={this.state.subLoaded}
					validate={(coupon) => { this.subscribeWithCoupon(coupon); }}/>)
			});
			content = (
				<div>
					<h1>Your subscriptions</h1>
					{subs}
				</div>
			);
		}
		else if (this.state.cards.length) {
			content = <SubscriptionPurchase
				subscribe={(amount) => { this.subscribe(amount) }}
				loaded={this.state.subLoaded}
				validate={(coupon) => { this.subscribeWithCoupon(coupon); }}/>;
		}

		return (
			<div className="subscription">
				<WaitForLoad loaded={this.state.loaded}>
					<CardsWidget
						cards={this.state.cards}
						addCard={(info) => { this.addCard(info) }}
						changeCard={(id,info) => { return this.changeCard(id,info) }}
						deleteCard={(id) => {this.deleteCard(id)}}
						loaded={this.state.cardLoaded}
						errors={this.state.error}/>
					{content}
				</WaitForLoad>
			</div>
		)
	}
}
