import * as sinon from 'sinon';
import { describe, it, test, then, when } from 'wattle';
import { last, reduce } from '../src/reduction';
import { Subject } from '../src/subject';
import './setup';

describe("reduce", function () {
    when("unbound", () => {
        let subscriber = sinon.stub();
        let sut = reduce(1);
        sut.subscribe(subscriber);

        it("starts with initial value", () => sut.value.should.equal(1));

        when("subscribed to an observable", () => {
            let subject = new Subject<string>();
            let reducer = sinon.stub();
            sut.on(subject, reducer);

            when("observable emits a value", () => {
                reducer.returns(3);
                subject.next('foo');

                then("reducer called with previous value and observable value", () => reducer.should.have.been.calledWith(1, 'foo'));

                then("value becomes return value of reducer", () => sut.value.should.equal(3));

                when("another value is emitted", () => {
                    reducer.returns(4);
                    subject.next('bar');

                    then("reducer called with previous value and observable value", () => reducer.should.have.been.calledWith(3, 'bar'));

                    then("value becomes return value of reducer", () => sut.value.should.equal(4));
                });
            });
        });

        when("a reducer accesses a reduced value", () => {
            let other = reduce(0);
            let subject = new Subject<number>();
            sut.on(subject, () => other.value);

            it("throws", () => (() => subject.next(0)).should.throw("Can't access a reduction value from inside a reducer: behaviour is undefined."));
        });
    });

    when("bound to events object", () => {
        let events = {};
        let sut = reduce(1, events);

        when("subscribing to an observable", () => {
            let subject = new Subject<string>();
            let getEvent = sinon.spy(() => subject);
            let reducer = sinon.stub();
            sut.on(getEvent, reducer);

            then("event getter called with bound events", () => getEvent.should.have.been.calledWith(events));

            then("reduction subscribed to result of event getter", () => {
                subject.next('foo');
                reducer.should.have.been.calledWith(1, 'foo');
            });
        });
    });

    test("last reduction updated when value is accessed", () => {
        let r1 = reduce(1);
        let r2 = reduce(2);

        r1.value;
        last.reduction!.should.equal(r1);

        r2.value;
        last.reduction!.should.equal(r2);
    });
});