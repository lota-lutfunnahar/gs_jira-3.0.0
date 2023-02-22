
var fields={
    'key':'key',
    'status':'status',
    'statusCategory':'status',
    'summary':'summary',
    'priority':'priority',
    'assignee':'assignee',
    'subtasks':'subtasks',
    'issuetype':'issuetype',
    'changelog':'changelog',
    'created':'created',
    'labels':'labels',
    'resolutiondate':'resolutiondate',
    'parent':'parent'
  };
  
  function Jira() {
    var del = '';
    this.fields_str = '';
    this.url='https://asgardia.atlassian.net';
    this.email='l.nahar@pipelinesecurity.net';
    this.token='zXkdynEDK7X5YJ3IWAlND2A5';
    for(var field in this.fields) 
    {
      if(field == 'changelog')
      {
        this.changelog = true;
        continue;
      }
      if(field == 'statusCategory')
        if(this.fields.status !== undefined)
          continue;
      this.fields_str += del+this.fields[field];
      del=',';
    }
    this.fields_str = '&fields='+this.fields_str;
    if(this.changelog)
      this.fields_str += '&expand=changelog';
    
    this.MapIssueType =  function(type)
    {
      return type;
    }
    this.compare_item = function(a, b)
    {
      if(a.created < b.created)
      {
        return -1;
        // a should come after b in the sorted order
      }
      else if(a.created > b.created)
      {
        return 1;
        // and and b are the same
      }
      else
      {
        return 0;
      }
    }
    
    this.ReadDataValues=function(data)
    {
      for(i=0;i<data["values"].length;i++)
      {
        if(data["values"][i].completeDate != null)
        {
          data["values"][i].completeDate=new Date( String(data["values"][i].completeDate)); 
    
        }
        if(data["values"][i].startDate != null)
        {
          data["values"][i].startDate=new Date( String(data["values"][i].startDate))
    
        }
        if(data["values"][i].endDate != null)
        {
          data["values"][i].endDate=new Date( String(data["values"][i].endDate))
    
        } 
      }
      if(data['isLast'] === false)
      {
        this.more=true;
        this.maxResults = data['maxResults'];
      }
      else
        this.more=false;
      return data["values"];
    }
    this.ReadDataIssues = function(data)
    {
      var issues=[];
      for(i=0;i<data["issues"].length;i++)
      {
        //console.log(data["issues"][i]);
        issue = {};
        for(var field in this.fields) 
        {
          switch(field)
          {
            case 'key': 
              issue.key = data["issues"][i].key;
              break;
            case 'status':
              issue.status = data["issues"][i].fields.status.name;
              break;
            case 'statusCategory':
              categoryid = data["issues"][i].fields.status.statusCategory.id;
              if(categoryid == 3)
                issue.statusCategory = 'RESOLVED';
              else if(categoryid == 4)
                issue.statusCategory = 'INPROGRESS';
              else
                issue.statusCategory ='OPEN';
              break;
            case 'created':
              issue.created = new Date( String(data["issues"][i].fields.created));
      
              break;
            case 'resolutiondate':
              if(data["issues"][i].fields.resolutiondate == null)
                issue.resolutiondate=null;
              else
              {
                issue.resolutiondate = new Date( String(data["issues"][i].fields.resolutiondate));       
              }
              break;
            case 'statuscategorychangedate':
              if(data["issues"][i].fields.statuscategorychangedate == null)
                issue.statuscategorychangedate = null;
              else
              {
                issue.statuscategorychangedate = new Date( String(data["issues"][i].fields.statuscategorychangedate));
              }
              break;
            case 'timeoriginalestimate':
              issue.timeoriginalestimate = data["issues"][i].fields.timeoriginalestimate;
              break;
            case 'issuetype':
              issue.issuetype =  this.MapIssueType(data["issues"][i].fields.issuetype.name);
              break;
            case 'assignee':
              if(data["issues"][i].fields.assignee == null)
                issue.assignee = 'Unassigned';
              else
              issue.assignee = data["issues"][i].fields.assignee.displayName.split(" ");
              break;
            case 'description':
              issue.description = data["issues"][i].fields.description;
              break;
            case 'summary':
              issue.summary = data["issues"][i].fields.summary;
              break;
            case 'priority':
              if(data["issues"][i].fields.priority === undefined)
                issue.priority = null;
              else
              {
                if(data["issues"][i].fields.priority == null)
                  issue.priority = null;
                else
                  issue.priority = data["issues"][i].fields.priority.name;
              }
              break;
            case 'subtasks':
              issue.subtasks = [];
              if(data["issues"][i].fields.subtasks == undefined)
                break;
              for(var j=0;j<data["issues"][i].fields.subtasks.length;j++)
              {
                issue.subtasks [j] = {};
                issue.subtasks [j].key = data["issues"][i].fields.subtasks[j].key;
                issue.subtasks [j].type = data["issues"][i].fields.subtasks[j].fields.issuetype.name;
                issue.subtasks [j].status = data["issues"][i].fields.subtasks[j].fields.status.name;
              }
              break;
            case  'changelog':
              issue.transitions = [];
              if( data["issues"][i].changelog != null)
              {
                for(var j=0;j<data["issues"][i].changelog.histories.length;j++)
                {
                  history = data["issues"][i].changelog.histories[j];
                  for(var k=0;k<history.items.length;k++)
                  {
                    item=history.items[k];
                    if(item.field == "status")
                    {
                      item.created = new Date( String(history.created));
                      issue.transitions.push(item);
                    }
                  }
                }
              }                        
              break;
            case 'issuelinks':
              issue.linkedtasks = [];
              if(data["issues"][i].fields.issuelinks === undefined)
                break;
              for(j=0;j<data["issues"][i].fields.issuelinks.length;j++)
              {
                link = data["issues"][i].fields.issuelinks[j];
                lissue = {};
                if(link.outwardIssue !== undefined)
                {
                  lissue.key = link.outwardIssue.key;
                  lissue.type = link.outwardIssue.fields.issuetype.name;
                  lissue.status = link.outwardIssue.fields.status.name;
                  categoryid = link.outwardIssue.fields.status.statusCategory.id;
                  if(categoryid == 3)
                    lissue.statusCategory = 'RESOLVED';
                  else if(categoryid == 4)
                    lissue.statusCategory = 'INPROGRESS';
                  else
                    lissue.statusCategory ='OPEN'; 
                  issue.linkedtasks.push(lissue); 
                }   
              }
              break;
            case 'parent':
              if(data["issues"][i].fields.parent == null)
                issue.parent = null;
              else
                issue.parent = data["issues"][i].fields.parent.key;
              break;
            case 'labels':
              if(data["issues"][i].fields.labels == null)
                issue.labels=[];
              else
                issue.labels = data["issues"][i].fields.labels;
              break;
            default:
              console.log(field)
              if(data["issues"][i].fields[fields[field]] == null)
                issue[field] = null;
              else 
                issue[field] =  data["issues"][i].fields[fields[field]]; 
              break;
          
          }
        }
        issue.transitions.sort(this.compare_item);
        issues.push(issue);
      }
      return issues;
    }
    this.ParseResponse = function(httpResponse)
    {
      var issues = [];
      if (httpResponse) 
      {  
        var rspns = httpResponse.getResponseCode();
        switch(rspns)
        {
          case 200:          
            var data = JSON.parse(httpResponse.getContentText()); 
            if(Array.isArray(data)===true)
            {
              return data;
            }
            else if(data["values"] !== undefined)
              return this.ReadDataValues(data);
              
            else if(data["issues"] !== undefined)
              return this.ReadDataIssues(data);
  
            throw new Error("Data cannot be parsed");
            break;
          case 404:
            //throw new Error("Response error, No item found");
            break;
          default:
            throw new Error(httpResponse.getContentText());
            //var data = JSON.parse(httpResponse.getContentText());
            //throw new Error("Error: " + data.errorMessages.join(",")); // returns all errors that occured
            break;
        }
      }
      else 
      {
        throw new Error("Unable to make requests to Jira!");
      }
      return issues;
    }
  
    this.JiraFetch = function(resource)
    {
      console.log(resource)
      var start=0;
      var max=100;
      var args = {
        contentType: "application/json",
        headers: {"Authorization":"Basic "+String(Utilities.base64Encode(this.email+":"+this.token))},
        muteHttpExceptions : true
      };
      var allissues = [];
      this.more=false;
      while(1)
      {
        var resource_ = resource+'&startAt='+start+'&maxResults='+max;
        console.log("Fetching = "+resource_);
        var httpResponse = UrlFetchApp.fetch(resource_, args);
        var issues = this.ParseResponse(httpResponse);
        if(this.more===true)
        {
            max = this.maxResults;
        }
        allissues = allissues.concat(issues);
        
        if(issues.length == max)
        {
          start = start + max;
        }
        else
        {
          console.log("Found "+allissues.length+" Records");
          return allissues;
        }
      }
      return [];  
    }
    this.GetTasksInSprint = function(sprintid,allfields=false)
    {
      var resource = this.url+"/rest/agile/1.0/sprint/"+sprintid+"/issue?";
      if(allfields == false)
        resource += this.fields_str;
      
      return this.JiraFetch(resource);
    }
  
    this.BoardSprints = function(boardid)
    {
      var resource = this.url+"/rest/agile/1.0/board/"+boardid+'/sprint?';
      return this.JiraFetch(resource);
    }
    this.GetAllStatus =  function()
    {
      var resource = this.url+"/rest/api/latest/status?";
      var statuses = this.JiraFetch(resource);
      var out = [];
      for(var i=0;i<statuses.length;i++)
      {
        var status = statuses[i];
        out[status.name.toLowerCase()]={'id' : status.statusCategory.id,'category':status.statusCategory.name};
      }
      return out;
    }
    this.GetSprintDetails = function(boardid,sprintname)
    {
      var sprints = this.BoardSprints(boardid);
      
      sprintname = sprintname.toLowerCase();
      for(var i=0;i<sprints.length;i++)
      {
        //console.log(sprintname+" #  "+sprints[i].name.toLowerCase());
        if(sprints[i].name.toLowerCase() === sprintname)
        {
          return sprints[i];
        } 
      }
      return null;
    }
    this.SearchIssues=function(jql,allfields=false)
    {
      var resource = this.url+"/rest/api/latest/search?"+'jql='+jql;
      if(allfields == false)
        resource += this.fields_str;
      return this.JiraFetch(resource);
    }
    this.GetFields=function()
    {
      var resource = this.url+"/rest/api/latest/field?param=null";
      return this.JiraFetch(resource);
    }
    this.DumpFields=function()
    {
      var fields = this.GetFields(this.url);
      for(var i=0;i<fields.length;i++)
      {
        console.log(fields[i]);
      }
    }
    this.Parents=function(tasks,parent_field='epiclink')  // or 'parent'
    {
      var epics = [];
      var count = 0;
      for(var i=0;i<tasks.length;i++)
      {
        var task = tasks[i];
        if(task[parent_field] != null)
        {
          epics[task[parent_field]]=task[parent_field];
          count++;
        }
      }
      if(count > 0)
      {
        epicsobj ={};
        var query='key in (';
        var del='';
        for (epic in epics) 
        {
          query += del+epic;
          del = ",";
        }
        query += ')';
        epics = this.SearchIssues(query);
        for(var i=0;i<epics.length;i++)
        {
          var epic=epics[i];
          epicsobj[epic.key]=epic;
        }
        for(var i=0;i<tasks.length;i++)
        {
          var task = tasks[i];
          if(task[parent_field] != null)
          {
            task[parent_field] = epicsobj[task[parent_field]];
          }
        }
      }
      return tasks;
    }
    this.ComputeTransitionTimes=function(task,statuses)
    {
      var status = task.status.toLowerCase();
      var category=statuses[status].category;
      var basestart = task.created;
      var statetime = {};	
          
      statetime[status] =  {};
      statetime[status].catgory=category
          statetime[status].start = basestart;
          statetime[status].end = null;
      statetime[status].min = [];
          
      for(var i=0; i < task.transitions.length ;i++)
      {
        var transition = task.transitions[i];
        //console.log(transition);
        var fromstate = transition.fromString.toLowerCase();
        var fromstate_category=statuses[fromstate].category;
  
  
              var tostate = transition.toString.toLowerCase();
        var tostate_category=statuses[tostate].category;
  
        //console.log (statuses[tostate].id+"  "+statuses[tostate].category);
        //if(statuses[tostate].id == 4)// in progress
        //{
        //  if(task.progressstartdate === undefined)
        //    task.progressstartdate = transition.created;
        //}
              var time = transition.created;
  
        if(statetime[fromstate] === undefined)
              {
                statetime[fromstate] =  {};
          statetime[fromstate].category = fromstate_category;
                statetime[fromstate].start = null;
                  statetime[fromstate].end = null;
          statetime[fromstate].min = [];
              }
              if(statetime[tostate] === undefined)
              {
                  statetime[tostate] =  {};
          statetime[tostate].category = tostate_category;
                  statetime[tostate].start = null;
                  statetime[tostate].end = null;
          statetime[tostate].min = [];
              }
        statetime[fromstate].end = time;
        if(statetime[fromstate].start == null)
                      statetime[fromstate].start = basestart;
        var min = (statetime[fromstate].end.getTime() - statetime[fromstate].start.getTime())/(1000*60);
        if(min > 0)
        {
          wmin=workingMinutesBetweenDates(statetime[fromstate].start,statetime[fromstate].end);
          if(wmin > 0)
                statetime[fromstate].min.push(wmin)
        }
        statetime[tostate].start = time;
              statetime[tostate].end = null;
        //console.log(statetime);
      }
      //console.log(statetime);
      for(var state in statetime) 
      {
        var obj = statetime[state];
        
        if(obj.end == null)
        {
          if(task.resolutiondate !== null)
            statetime[state].end = statetime[state].start;
          else
                  statetime[state].end = new Date();
          
          min = (statetime[state].end.getTime() - statetime[state].start.getTime())/(1000*60);
          if(min > 0)
          {
            wmin=workingMinutesBetweenDates(statetime[state].start,statetime[state].end);
            if(wmin > 0)
                  statetime[state].min.push(wmin)
          }
        }
        obj.state = state;
        obj.minutes = 0;
        for(var i=0;i<obj.min.length;i++)
        {
          obj.minutes += obj.min[i];
        }
        //console.log(obj);
        obj.dhm = SecondsToDhm(obj.minutes*60);
        //console.log(task.key,obj.dhm);
        if((obj.category !== undefined)&&(obj.category == 'In Progress'))
        {
          if( statetime.inprogressmin === undefined)
            statetime.inprogressmin=0;
          statetime.inprogressmin += obj.minutes
        } 
      }
      statetime.inprogressdhm = SecondsToDhm(statetime.inprogressmin*60);
      task.statetime = statetime;
      return statetime;
    }
  }
  