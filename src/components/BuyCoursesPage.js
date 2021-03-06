import React, {Component} from 'react';
import Header from './Header';
import SearchBar from './SearchBar';
import Cart from './Cart';
import axios from 'axios';
import Course from "./Course";
import isEmpty from 'lodash.isempty';
import SecureLS from 'secure-ls';
import {ThemeProvider} from '@zendeskgarden/react-theming';
import {Pagination} from '@zendeskgarden/react-pagination';
import {EmptyCartPopup, SucessEmptyCartPopup} from './Popups';
import '../style/BuyCoursesPage.css';
import '@zendeskgarden/react-pagination/dist/styles.css';

class BuyCoursesPage extends Component {
    constructor() {
        super();
        this.securels = new SecureLS();
        this.state = {
            loading: true,
            courses: [],
            filtered: [],
            cart: [],
            sortby: '',
            currentPage: 1,
            exchangeto: 'Choose...',
            errormsg: 'No results'
        };
        this.readmoreisopened = null;
        this.exchangevalues = null;
        this.eachCourse = this.eachCourse.bind(this);
        this.addToCart = this.addToCart.bind(this);
        this.removeFromCart = this.removeFromCart.bind(this);
        this.searchCourses = this.searchCourses.bind(this);
        this.handleChangeStateWithObject = this.handleChangeStateWithObject.bind(this);
        this.sorted = this.sorted.bind(this);
        this.clearCartPopup = this.clearCartPopup.bind(this);
        this.closeOpenDescription = this.closeOpenDescription.bind(this);
    }

    /**
     * @description - Initialization that requires DOM nodes and load data from a remote endpoint
     * @steps -
     * 1) Get courses data and save it to courses and filtered arrays in state object, change status of loading page to false
     * 2) Get Exchange rate values for the USD and save it in global variable (exchangevalues)
     * 3) Check localstorage cart (key) if exist that mean there is saved cart items, transfer localstorage cart values to cart array in state (object)
     */
    componentDidMount() {
        const firstRequest = axios.get('https://testapi.io/api/MohamadHusari/courses').then(res => {
            this.setState({courses: res.data.courses, loading: false, filtered: res.data.courses});
        }).catch(err => {
            this.setState({
                loading: false,
                errormsg: 'Can\'t load items data, please try again later'
            });
        });
        const secondRequest = axios.get('https://api.exchangeratesapi.io/latest?base=USD').then((res) => {
            this.exchangevalues = res.data.rates;
        }).catch(err => {
            this.exchangevalues = null;
        });
        Promise.all([firstRequest, secondRequest]).then(() => {
            if (this.state.errormsg === 'No results' && localStorage.cart) {
                this.setState({
                    cart: this.securels.get('cart')
                }, () => this.clearCartPopup('Your cart isn\'t empty!!', 'Do you want to reset it?', 'warning'));
            }
        });
    };

    /**
     * Used in (SearchBar Component)
     * First use :
     * @param obj - exmaple {sortway: "PriceUp", currentPage:1}
     *  get the selected value of Currency (selector) from SearchBar (component)
     * @description: Change that selected value and hold in exchangeto key in state object.
     *
     * Second use:
     * Selector value of the Sort by selector change the value with sortby in state object
     * @description: This function moved to SearchBar component by props with name.
     */
    handleChangeStateWithObject = (obj) => {
        this.setState({
            ...obj
        });
    };

    /**
     *
     * @param buttonref - Alwayes holds that pressed read more button
     * @steps -
     * 1) Check if read more(or read less) clicked and save reference (react RF) to the (button) in readmoreisopened variable
     * 2) Else check if the same (read more / read less button clicked)
     * 2.1) if the same change readmoreisopened to null
     * 2.2) else if  not the same (click the read more / read less before to close it and open the new one)
     */
    closeOpenDescription = (buttonref) => {
        if (this.readmoreisopened === null) {
            this.readmoreisopened = buttonref;
        } else {
            if (this.readmoreisopened === buttonref)
                this.readmoreisopened = null;
            else {
                try {
                    this.readmoreisopened.current.click();
                } catch (error) {
                    this.readmoreisopened = null;
                } finally {
                    this.readmoreisopened = buttonref;
                }

            }
        }
    };

    /**
     * @description - Sort the filtered array by which option that selected in select box ( Function orderBy changed by the component SearchBar )
     * @steps -
     * 1) Get the filtered array of courses and the sort way that selected by select box in component SearchBar form state object
     * 2) sort the filtered array by the sort way (DateUP,DateDOWN,PriceUP,PriceDOWN,LevelUP,LevelDOWN)
     * @returns sorted filtered courses array with different way
     */
    sorted = () => {
        const {filtered, sortby} = this.state;
        const level = {
            "Beginners": 0,
            "Lower Intermediate": 1,
            "Upper Intermediate": 2,
            "Lower Advanced": 3,
            "Advanced": 4,
            "Upper Advanced": 5
        };
        switch (sortby) {
            case 'DateUP':
                return filtered.sort((a, b) => new Date(a.added_date) - new Date(b.added_date));
            case 'DateDOWN':
                return filtered.sort((a, b) => new Date(b.added_date) - new Date(a.added_date));
            case 'PriceUP':
                return filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            case 'PriceDOWN':
                return filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            case 'LevelUP':
                return filtered.sort((a, b) => ((level[b.level] < level[a.level]) ? -1 : ((level[b.level] > level[a.level]) ? 1 : (a.id < b.id) ? -1 : (a.id > b.id) && 1)));
            case 'LevelDOWN':
                return filtered.sort((a, b) => ((level[a.level] < level[b.level]) ? -1 : ((level[a.level] > level[b.level]) ? 1 : (a.id < b.id) ? -1 : (a.id > b.id) && 1)));
            default:
                return filtered.sort((a, b) => new Date(b.added_date) - new Date(a.added_date));
        }

    };

    /**
     *
     * @param title - The Popup title
     * @param text - The Popup text
     * @param type - The Popup type ( 'success' | 'error' | 'warning' | 'info' | 'question')
     * @description - Show this Popup when reload a tab or join the website again and the cart is not empty
     */
    clearCartPopup = (title, text, type) => {
        if (!isEmpty(this.state.cart)) {
            EmptyCartPopup(title, text, type).then((result) => {
                if (result.value) {
                    SucessEmptyCartPopup().then(() => {
                        this.setState({
                            cart: [],
                        }, () => localStorage.clear());
                    })
                }
            })
        }
    };

    /**
     *
     * @param id - Course id number
     * @param name - Course name
     * @param price - Course Price
     * @description - Save/Add the course in cart array and show it in the cart aside category and save the cart array in localstorage under ket cart
     */
    addToCart = ({id, name, price}) => {
        this.setState({cart: [...this.state.cart, {"id": id, "name": name, "price": price}]}, () => {
            this.securels.set('cart', this.state.cart);
        });
    };

    /**
     *
     * @param id - Course id
     * @description - Remove the course from the cart list by course id and update the cart array in object state and save it in localstorage under ket cart
     */
    removeFromCart = (id) => {
        this.setState({
            cart: this.state.cart.filter(course => {
                return course.id !== id;
            })
        }, () => {
            this.securels.set('cart', this.state.cart);
        });
    };

    /**
     *
     * @param value - get target value of the search input field
     * @description - filter the courses data by checking if course name includes search bar value (that write) and save the last array in filtered in state object
     */
    searchCourses = ({target: {value}}) => {
        // Variable to hold the original version of the list
        let currentList = [];
        // Variable to hold the filtered list before putting into state
        let newList = [];
        // If the search bar isn't empty
        if (value !== "") {
            // Assign the original list to currentList
            currentList = this.state.courses;

            // Use .filter() to determine which items should be displayed
            // based on the search terms
            newList = currentList.filter(course => {
                // change current item to lowercase
                const coursename = course.name.toLowerCase();
                // change search term to lowercase
                const filter = value.toLowerCase();
                // check to see if the current list item includes the search term
                // If it does, it will be added to newList. Using lowercase eliminates
                // issues with capitalization in search terms and search content
                return coursename.includes(filter);
            });
        } else {
            // If the search bar is empty, set newList to original task list
            newList = this.state.courses;
        }
        // Set the filtered state based on what our rules added to newList
        this.setState({
            filtered: newList
        });
    };

    /**
     * @description - print course component for each course in courses array in state object
     * @param course - Course object
     * @param i - Course index
     * @steps:
     * 1) check if cart is not empty and course id not includes in cart
     *  1.1) then but isInCard to true
     * 2) Else is not in cart
     *  2.1) Print the default Course component that isInCard={false} have value false
     * @returns Course Component
     */
    eachCourse = (course, i) => {
        if (!isEmpty(this.state.cart) && this.state.cart.some(cartcourse => cartcourse.id === course.id)) {
            return (
                <Course key={course.id} closeOpenDescription={this.closeOpenDescription} addToCart={this.addToCart}
                        removeFromCart={this.removeFromCart} isInCard={true} exChangeValues={this.exchangevalues}
                        exChangeTo={this.state.exchangeto}>
                    {course}
                </Course>
            );
        } else {
            return (
                <Course closeOpenDescription={this.closeOpenDescription} key={course.id} addToCart={this.addToCart}
                        removeFromCart={this.removeFromCart} isInCard={false} exChangeValues={this.exchangevalues}
                        exChangeTo={this.state.exchangeto}>
                    {course}
                </Course>
            );
        }
    };

    render() {
        const {currentPage} = this.state;
        const filteredLength = this.state.filtered.length;
        return (
            <>
                <Header cartSize={this.state.cart.length}/>
                <div className="container">
                    <SearchBar searchCourses={this.searchCourses}
                               handleChangeStateWithObject={this.handleChangeStateWithObject}/>
                    <div className="row">
                        <div id="main" className="col-12 col-lg-9 order-1 order-lg-0">
                            {
                                this.state.loading ?
                                    <div className="d-flex justify-content-center align-items-center h-100">
                                        <div className="spinner-border" role="status">
                                            <span className="sr-only">Loading...</span>
                                        </div>
                                    </div>
                                    :
                                    isEmpty(this.state.filtered) ?
                                        <p className="d-flex h-100 justify-content-center align-items-center text-uppercase">{this.state.errormsg}</p>
                                        :
                                        <div className="col-12">
                                            <div className="row">
                                                {this.sorted().slice((currentPage * 10) - 10, (currentPage * 10 > filteredLength) ? filteredLength : currentPage * 10).map(this.eachCourse)}
                                            </div>
                                            <div className="my-2">
                                                <ThemeProvider>
                                                    <Pagination totalPages={Math.ceil(filteredLength / 10)}
                                                                currentPage={currentPage}
                                                                onChange={(currentPage) => {
                                                                    this.setState({currentPage}, () => this.forceUpdate())
                                                                }}/>
                                                </ThemeProvider>
                                            </div>
                                        </div>

                            }
                        </div>
                        <div className="col-lg-3 order-0 order-lg-1 my-2 my-lg-0 mx-3 mx-lg-0">
                            <Cart cartList={this.state.cart} loading={this.state.loading}
                                  clearCartPopup={this.clearCartPopup} removeFromCart={this.removeFromCart}
                                  exChangeValues={this.exchangevalues} exChangeTo={this.state.exchangeto}/>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default BuyCoursesPage;