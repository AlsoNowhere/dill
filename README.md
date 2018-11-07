# dill
Small scale JS framework

Build JS stuff with this small framework.
I'll have to add more to this and do a proper job.

 - Render
 ```
<div id="display">
    <p>Example: {{example}}</p>
</div>
dill.render(document.getElementById("display"),{example:"Hello World!"});
```
 
 - Components
 ```
<example></example>
dill.component("example",{example:"Hello World!"},`<p>Example: {{example}}</p>`);
```

 - Bind to attributes
 ```
<input type="text" [name]="name" id="display" />
dill.render(document.getElementById("display"),{name:"one"});
```

 - Bind events to elements
 ```
<button type="button" (click)="run" id="display">Run</button>
dill.render(document.getElementById("display"),{run(){console.log("Hello World!"}});
```

 - Data inherits on the prototype!
 ```
<div id="display">
    <p-tag></p-tag>
</div>
dill.component("p-tag",{one:"One},`<p>{{one}} - {{two}}`);
dill.render(document.getElementById("display"),{two:"Two"});
// <p>One - Two</p>
```

 - Remove element
 ```
<div dill-if="case" id="display"></div>
dill.render(document.getElementById("display"),{case:false});
```

 - Reproduce element
 ```
<div dill-for="list" id="display"></div>
dill.render(document.getElementById("display"),{list:[1,2,3]});
```
