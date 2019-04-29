const {SpanKind, CanonicalCode} = require('../../packages/opencensus-core');
const {TracingBase} = require('../../packages/opencensus-nodejs/build/src/trace/tracing-base');
const zipkin = require('../../packages/opencensus-exporter-zipkin/build/src');
const zpages = require('../../packages/opencensus-exporter-zpages');

const tracing = TracingBase.instance;

const logger = {
        info: console.info,
        warn: console.warn,
        debug: console.debug,
        error: console.error
};

tracing.registerExporter(new zipkin.ZipkinTraceExporter({
        url: 'http://localhost:9411/api/v2/spans',
        serviceName: 'my-service',
        logger
}));
tracing.registerExporter(new zpages.ZpagesExporter({
        port: 8080,
        startServer: true
}));

const tracer = tracing.start({
        logLevel: 4,
        logger,
        samplingRate: 1.0  // always sampler
}).tracer;

tracer.startRootSpan({ name: 'my-root-span' }, (rootSpan) => {
        rootSpan.addAttribute('foo', JSON.stringify({ foo: 'bar' }));

        const span1 = rootSpan.tracer.startChildSpan({
                name: 'my-child-span-1',
                kind: SpanKind.SERVER,
                childOf: rootSpan
        });

        const span2 = rootSpan.tracer.startChildSpan({
                name: 'my-child-span-2',
                kind: SpanKind.CLIENT,
                childOf: span1
        });

        const span3 = rootSpan.tracer.startChildSpan({
                name: 'my-child-span-3',
                childOf: span1
        });

        const span4 = rootSpan.tracer.startChildSpan({
                name: 'my-child-span-4',
                childOf: span3
        });
        span4.setStatus(CanonicalCode.UNIMPLEMENTED);

        setTimeout(function() {
                span4.end()
                setTimeout(function() {
                        span2.addAnnotation(
                                'Cache miss during GC',
                                {store: 'memcache', cache_miss: true}
                              );
                        span3.end();
                        setTimeout(function() {
                                span2.end();
                                setTimeout(function() {
                                        span1.end();
                                        setTimeout(function() {
                                                rootSpan.end();

                                                setInterval(() => {}, 100);
                                        }, 10);
                                }, 10);
                        }, 10);
                }, 10);
        }, 10);
});


