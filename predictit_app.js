var app = new Vue({
    el: '#app',
    data: {
        marketid: '6867',
        market_title: 'Market information will appear here after you click',
        market_url: '#',
        profit: 0,
        contracts: {},
        top_markets: [],
        time_last_update: 'never',
        time_since_update: 'NA',
        // data for calculator
        fields: [
            {'p': 87, 'x': 10},
            {'p': 81, 'x': 13},
            {'p': 83, 'x': 18},
        ],
        fee: 10,
        calculated_investment: 0,
        calculated_worst_payoff: 0,
        calculated_min_payoff: 0,
    }, //data
    methods: {
        refreshTime: function() {
            this.time_last_update = moment()
            this.time_since_update = moment(this.time_last_update).fromNow()
        },
        getBest: function() {

            url = "https://j4ukttnu2g.execute-api.us-east-2.amazonaws.com/default/predictit-market-info"
            this.$http.get(url).then(response => {
                r = response.body
                console.log("Most profitable market:")
                console.log(r[0])
                this.marketid = r[0]['market_id']
                this.top_markets = r.slice(0, 3)

                for(let market of this.top_markets) {
                    market.market_url =  "https://www.predictit.org/markets/detail/" + market['market_id']
                }
                this.market_url = "https://www.predictit.org/markets/detail/" + app.contracts[0]['marketId']
                var button = this.$refs.getmarket
                button.click()
            })
        },
        getMarket: function() {
            // get url parameters
            const urlSearchParams = new URLSearchParams(window.location.search);
            const params = Object.fromEntries(urlSearchParams.entries());
            debug = params["debug"]
            //debug = this.$route.query.debug
            if(debug == 1) {
                console.log("Running in debug mode!");
                url = 'fake_response.json';
            } else {
                url = "https://j4ukttnu2g.execute-api.us-east-2.amazonaws.com/default/predictit-market-info?market_id=" + this.marketid;
            }

            //
            console.log("Getting " + url)

            this.$http.get(url).then(response => {
                this.contracts = response.body

                // round number of shares
                for (let row of this.contracts) {
                    row.x = Math.round(30*row.x)
                }
                console.log("response body")
                console.log(response.body)
                this.market_title = app.contracts[0]['marketName']
                this.market_url = "https://www.predictit.org/markets/detail/" + app.contracts[0]['marketId']
                this.profit = app.contracts[0]['profit']
                console.log(this.contracts[0])
                this.refreshTime()
            })
        },
        addContract: function() {
            app.fields.push({'p': 12, 'x': 12})
        },

        removeContract: function(i) {
            app.fields.splice(i, 1)
        },
        computeProfit: function() {
            investment = 0
            ret = 0
            best_ret = 0

            for (let row of this.contracts) {
                x = row.x
                p = row.bestNoPrice
                investment += p*x
                reti =  x * ( p + (1-this.fee/100.) * (1-p) )
                ret += reti
                best_ret = Math.max(best_ret, reti)
            }
            this.calculated_investment = investment
            this.calculated_worst_payoff = ret - best_ret
            this.calculated_min_payoff =  this.calculated_worst_payoff - investment
        },
        loadMarket: function() {
            this.fields = this.contracts.map( item  => ({'x': item.x, 'p': item.bestNoPrice*100}))

        }
    }, //methods
    filters: {
        round : function (value) {
            return value.toFixed(3)
        }
    }, // filters
    watch: {

        contracts: {
            handler(val, oldVal) {
                var button = this.$refs.computepayoff
                button.click()
            },
            deep: true
        },
    }, //watch
    created() {
        this.$nextTick(function () {
            var button = this.$refs.getmarket
            button.click()
            var self = this;

            setInterval(function() {
                console.log("tick")
                self.time_since_update = moment(self.time_last_update).fromNow()
            }, 10000);

        })
    } //created
})
